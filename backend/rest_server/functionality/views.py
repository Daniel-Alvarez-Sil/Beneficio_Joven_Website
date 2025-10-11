from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets, mixins
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import (
    Apartado, Cajero, Canje, Categoria, Negocio,
    Promocion, PromocionCategoria, Usuario, AdministradorNegocio
)
from .serializers import (
    CajeroCreateSerializer, NegocioSolicitudSerializer,
    PromocionCreateSerializer, PromocionListSerializer,
    EstadisticasResponseSerializer
)

# ---------- Utilidades ----------
def get_current_user_id(request):
    # Si tienes JWT/SessionAuth, DRF llenará request.user
    if getattr(request, "user", None) and getattr(request.user, "id", None):
        return request.user.id
    # Fallback por header explícito
    header_id = request.headers.get("X-User-Id")
    return int(header_id) if header_id is not None and header_id != "" else None

def assert_owner(request, negocio: Negocio):
    user_id = get_current_user_id(request)
    if user_id is None:
        return Response({"detail": "Falta CONTEXTO_GLOBAL ID_USUARIO."}, status=400)
    if str(negocio.id_usuario_id) != str(user_id):
        return Response({"detail": "No eres dueño de este negocio."}, status=403)
    return None

# ---------- 1) Registro de COLABORADOR (Cajero) ----------
class RegistroColaboradorView(APIView):
    """
    POST /api/colaborador/registro/
    Crea un Cajero ligado a un negocio propiedad del usuario.
    """
    permission_classes = [AllowAny]  # cámbialo a IsAuthenticated si ya tienes auth

    def post(self, request):
        user_id = get_current_user_id(request)
        if user_id is None:
            return Response({"detail": "Falta CONTEXTO_GLOBAL ID_USUARIO."}, status=400)

        ser = CajeroCreateSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)

        negocio: Negocio = ser.validated_data["id_negocio"]
        perm = assert_owner(request, negocio)
        if perm is not None:
            return perm

        cajero = ser.save()
        return Response({"id": cajero.id, "detail": "Colaborador registrado."}, status=201)

# ---------- 2) Registro de Solicitud de Negocio ----------
class RegistroSolicitudNegocioView(APIView):
    """
    POST /api/negocios/solicitudes/
    Crea un Negocio con estatus 'PENDIENTE' para el usuario actual.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = get_current_user_id(request)
        if user_id is None:
            return Response({"detail": "Falta CONTEXTO_GLOBAL ID_USUARIO."}, status=400)

        ser = NegocioSolicitudSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)

        negocio = Negocio.objects.create(
            id_usuario_id=user_id,
            fecha_creado=timezone.now(),
            estatus="PENDIENTE",
            **ser.validated_data
        )
        return Response({"id": negocio.id, "estatus": negocio.estatus}, status=201)

# ---------- 3-5) Promociones (CRUD + cambiar estatus) ----------
class PromocionViewSet(mixins.ListModelMixin,
                       mixins.RetrieveModelMixin,
                       mixins.CreateModelMixin,
                       mixins.DestroyModelMixin,
                       viewsets.GenericViewSet):
    """
    /api/promociones/  (GET, POST)
    /api/promociones/{id}/  (GET, DELETE)
    /api/promociones/{id}/estatus/  (PATCH)  -> activa/pausada/finalizada (ajusta fechas)
    """
    queryset = Promocion.objects.all().select_related("id_negocio")
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return PromocionListSerializer
        return PromocionCreateSerializer

    def list(self, request, *args, **kwargs):
        """
        Filtra por negocio del usuario actual si se agrega ?solo_mis=true
        y/o por id_negocio explícito.
        """
        qs = self.get_queryset()
        id_negocio = request.query_params.get("id_negocio")
        solo_mis = request.query_params.get("solo_mis") in ("true", "1", "True")

        if id_negocio:
            qs = qs.filter(id_negocio_id=id_negocio)

        if solo_mis:
            user_id = get_current_user_id(request)
            if user_id is None:
                return Response({"detail": "Falta CONTEXTO_GLOBAL ID_USUARIO."}, status=400)
            qs = qs.filter(id_negocio__id_usuario_id=user_id)

        page = self.paginate_queryset(qs.order_by("-inicio_promocion", "-id"))
        ser = PromocionListSerializer(page, many=True, context={"request": request})
        return self.get_paginated_response(ser.data)

    def create(self, request, *args, **kwargs):
        ser = PromocionCreateSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        out = PromocionListSerializer(obj, context={"request": request}).data
        return Response(out, status=201)

    def destroy(self, request, *args, **kwargs):
        promocion: Promocion = self.get_object()
        perm = assert_owner(request, promocion.id_negocio)
        if perm is not None:
            return perm
        promocion.delete()
        return Response(status=204)

    @action(detail=True, methods=["patch"], url_path="estatus")
    def cambiar_estatus(self, request, pk=None):
        """
        PATCH body:
        {
          "estado": "ACTIVA" | "PAUSADA" | "FINALIZADA",
          "final_promocion": "2025-12-31T23:59:00Z"   # opcional si reactivas
        }

        Implementación basada en fechas (modelo no tiene 'estatus' explícito):
        - ACTIVA: si ya venció, puedes actualizar 'final_promocion' (si se envía).
        - PAUSADA: se fuerza 'final_promocion' = now (efecto inmediato).
        - FINALIZADA: idem 'PAUSADA' pero semánticamente se considera cierre definitivo.
        """
        promocion: Promocion = self.get_object()
        perm = assert_owner(request, promocion.id_negocio)
        if perm is not None:
            return perm

        estado = (request.data.get("estado") or "").upper().strip()
        ahora = timezone.now()

        if estado == "PAUSADA":
            promocion.final_promocion = ahora
            promocion.save(update_fields=["final_promocion"])
        elif estado == "FINALIZADA":
            promocion.final_promocion = ahora
            promocion.save(update_fields=["final_promocion"])
        elif estado == "ACTIVA":
            # Si está futura, no hacemos nada; si ya expiró, permite reabrir si mandan nueva fecha fin
            new_fin = request.data.get("final_promocion")
            if new_fin:
                try:
                    # DRF puede parsear si usas DateTimeField en serializer;
                    # aquí hacemos parse rápido si viene string ISO.
                    from django.utils.dateparse import parse_datetime
                    dt = parse_datetime(new_fin)
                    if not dt or dt <= ahora:
                        return Response({"detail": "final_promocion debe ser futura."}, status=400)
                    promocion.final_promocion = dt
                    # Si el inicio está en el futuro, puedes mantenerlo; si ya pasó, asegúralo <= ahora
                    if promocion.inicio_promocion and promocion.inicio_promocion > dt:
                        return Response({"detail": "inicio_promocion no puede ser posterior a final_promocion."}, status=400)
                    if promocion.inicio_promocion and promocion.inicio_promocion > ahora:
                        # opcional: trae a 'now' si deseas activarla YA
                        promocion.inicio_promocion = ahora
                    promocion.save(update_fields=["inicio_promocion", "final_promocion"])
                except Exception:
                    return Response({"detail": "Formato inválido de final_promocion."}, status=400)
            else:
                # Si ya expiró y no mandan fecha, no podemos re-activar sin nueva 'final_promocion'
                if promocion.final_promocion and promocion.final_promocion <= ahora:
                    return Response(
                        {"detail": "Provee 'final_promocion' futura para reactivar."},
                        status=400
                    )
                # Si estaba programada (inicio > ahora), opcionalmente podrías mover inicio a ahora:
                if promocion.inicio_promocion and promocion.inicio_promocion > ahora:
                    promocion.inicio_promocion = ahora
                    promocion.save(update_fields=["inicio_promocion"])
        else:
            return Response({"detail": "estado inválido. Usa ACTIVA | PAUSADA | FINALIZADA."}, status=400)

        out = PromocionListSerializer(promocion, context={"request": request}).data
        return Response(out, status=200)

# ---------- 6) Estadísticas ----------
class EstadisticasNegocioView(APIView):
    """
    GET /api/negocios/{id_negocio}/estadisticas/
    Resumen de KPIs de promociones, canjes y apartados.
    """
    permission_classes = [AllowAny]

    def get(self, request, id_negocio: int):
        negocio = get_object_or_404(Negocio, pk=id_negocio)
        perm = assert_owner(request, negocio)
        if perm is not None:
            return perm

        now = timezone.now()
        promos = Promocion.objects.filter(id_negocio=negocio)

        total = promos.count()
        activas = promos.filter(inicio_promocion__lte=now, final_promocion__gte=now).count()
        futuras = promos.filter(inicio_promocion__gt=now).count()
        expiradas = promos.filter(final_promocion__lt=now).count()
        total_canjeados_campo = promos.aggregate(s=Sum("numero_canjeados"))["s"] or 0

        # Canjes registrados (tabla Canje)
        canjes_qs = Canje.objects.filter(id_promocion__in=promos)
        total_canje_registros = canjes_qs.count()

        # Apartados (reservas) de promociones de este negocio
        apartados_qs = Apartado.objects.filter(id_promocion__in=promos)
        total_apartados = apartados_qs.count()

        # Top 5 por numero_canjeados (campo en Promocion)
        top = list(
            promos.order_by("-numero_canjeados")
                  .values("id", "titulo", "numero_canjeados")[:5]
        )

        data = {
            "negocio_id": negocio.id,
            "total_promociones": total,
            "activas": activas,
            "futuras": futuras,
            "expiradas": expiradas,
            "total_canjeados_campo": total_canjeados_campo,
            "total_canje_registros": total_canje_registros,
            "total_apartados": total_apartados,
            "top_promociones_por_canjeados": top,
        }
        ser = EstadisticasResponseSerializer(data)
        return Response(ser.data, status=200)
