# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción:
#   Este módulo contiene las vistas para la gestión de negocios, promociones
#   y cajeros desde el rol de colaborador o administrador de negocio.
#
#   Incluye operaciones CRUD y endpoints para obtener estadísticas
#   de desempeño de promociones (canjes, top 5, histórico, etc.).
# =============================================================================

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from django.db import transaction, IntegrityError
from django.db.models import Q, Sum
from datetime import timedelta
from django.utils import timezone

# Serializadores
from .serializers import (
    AltaNegocioYAdminSerializer,
    PromocionListSerializer,
    DeleteUpdatePromocionSerializer,
    PromocionCreateSerializer,
    EstadisticasParamsSerializer,
    AltaCajeroSerializer
)

# Modelos
from ...models import (
    Promocion, Canje, AdministradorNegocio,
    Cajero, PromocionCategoria, CodigoQR, Apartado
)
from login.models import User


# =============================================================================
# Clase: AdministradorNegocioCreateView
# Descripción:
#   Permite crear un nuevo negocio junto con su administrador principal.
# =============================================================================
class AdministradorNegocioCreateView(APIView):
    """Crea un negocio y su administrador asociado."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        """Crea un nuevo negocio con su administrador correspondiente."""
        serializer = AltaNegocioYAdminSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(serializer.to_representation(result), status=status.HTTP_201_CREATED)


# =============================================================================
# Clase: PromocionListView
# Descripción:
#   Devuelve todas las promociones asociadas al negocio del colaborador autenticado.
# =============================================================================
class PromocionListView(APIView):
    """Lista las promociones pertenecientes al negocio del colaborador autenticado."""
    permission_classes = [permissions.AllowAny]  # Cambiar a IsAuthenticated en producción

    def get(self, request, *args, **kwargs):
        """Obtiene las promociones del negocio asociado al usuario autenticado."""
        id_administrador_negocio = request.user.id if request.user and request.user.is_authenticated else None
        username = User.objects.get(id=id_administrador_negocio).username if id_administrador_negocio else None

        try:
            administradorNegocio = AdministradorNegocio.objects.get(Q(usuario=username) | Q(correo=username))
        except AdministradorNegocio.DoesNotExist:
            administradorNegocio = Cajero.objects.get(Q(usuario=username) | Q(correo=username))

        if not administradorNegocio:
            return Response({"detail": "No se encontró el administrador de negocio."}, status=status.HTTP_404_NOT_FOUND)

        id_negocio = administradorNegocio.id_negocio

        promociones = Promocion.objects.filter(id_negocio=id_negocio).only(
            "id", "nombre", "descripcion", "fecha_inicio", "fecha_fin",
            "tipo", "porcentaje", "precio", "activo", "numero_canjeados", "imagen"
        )

        serializer = PromocionListSerializer(promociones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =============================================================================
# Clase: PromocionUpdateView
# Descripción:
#   Permite activar o desactivar una promoción existente.
# =============================================================================
class PromocionUpdateView(APIView):
    """
    Endpoint para cambiar el estado activo de una promoción.

    Ejemplo:
    POST /functionality/promociones/update/
    Body: {"id_promocion": 1}
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        """Alterna el estado activo/inactivo de una promoción."""
        serializer = DeleteUpdatePromocionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        promo_id = serializer.validated_data["id_promocion"]

        try:
            with transaction.atomic():
                promocion = Promocion.objects.select_for_update().get(pk=promo_id)
                promocion.activo = not promocion.activo
                promocion.save()
            return Response({"detail": "Promoción actualizada"}, status=status.HTTP_200_OK)

        except Promocion.DoesNotExist:
            return Response({"detail": "Promoción no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        except IntegrityError:
            return Response({"detail": "No se puede actualizar la promoción."}, status=status.HTTP_409_CONFLICT)


# =============================================================================
# Clase: PromocionDeleteView
# Descripción:
#   Elimina una promoción junto con sus relaciones (FKs) en modelos dependientes.
# =============================================================================
class PromocionDeleteView(APIView):
    """
    Elimina una promoción y todos sus registros relacionados:
    - PromocionCategoria
    - CodigoQR
    - Canje
    - Apartado
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        """Elimina una promoción y todas sus dependencias."""
        serializer = DeleteUpdatePromocionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        promo_id = serializer.validated_data["id_promocion"]

        try:
            with transaction.atomic():
                PromocionCategoria.objects.filter(id_promocion=promo_id).delete()
                CodigoQR.objects.filter(id_promocion=promo_id).delete()
                Canje.objects.filter(id_promocion=promo_id).delete()
                Apartado.objects.filter(id_promocion=promo_id).delete()
                Promocion.objects.select_for_update().get(pk=promo_id).delete()
            return Response({"detail": "Promoción eliminada"}, status=status.HTTP_200_OK)
        except Promocion.DoesNotExist:
            return Response({"detail": "Promoción no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        except IntegrityError:
            return Response(
                {"detail": "No se puede eliminar: existen registros relacionados."},
                status=status.HTTP_409_CONFLICT
            )


# =============================================================================
# Clase: EstadisticasNegocioView
# Descripción:
#   Devuelve estadísticas del negocio autenticado:
#   - Total de canjes
#   - Top 5 promociones con más canjes
#   - Top 5 con menos canjes
#   - Histórico de los últimos 7 días
# =============================================================================
class EstadisticasNegocioView(APIView):
    """Genera estadísticas sobre el desempeño de promociones de un negocio."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        """Obtiene estadísticas de canjes y rendimiento de promociones."""
        id_administrador_negocio = request.user.id if request.user and request.user.is_authenticated else None
        username = User.objects.get(id=id_administrador_negocio).username if id_administrador_negocio else None

        administradorNegocio = AdministradorNegocio.objects.get(Q(usuario=username) | Q(correo=username))
        if not administradorNegocio:
            return Response({"detail": "No se encontró el administrador de negocio."}, status=status.HTTP_404_NOT_FOUND)

        id_negocio = administradorNegocio.id_negocio

        # Total de canjes
        promos_qs = Promocion.objects.filter(id_negocio=id_negocio)
        total_canjes = promos_qs.aggregate(total=Sum("numero_canjeados"))["total"] or 0

        # Top 5 con más y menos canjes
        top5 = promos_qs.order_by("-numero_canjeados").values("nombre", "numero_canjeados")[:5]
        bottom5 = promos_qs.order_by("numero_canjeados").values("nombre", "numero_canjeados")[:5]

        top5_out = [{"titulo": p["nombre"], "numero_de_canjes": p["numero_canjeados"]} for p in top5]
        bottom5_out = [{"titulo": p["nombre"], "numero_de_canjes": p["numero_canjeados"]} for p in bottom5]

        # Histórico últimos 7 días
        since = timezone.now() - timedelta(days=7)
        canjes_qs = Canje.objects.select_related("id_promocion").filter(
            id_promocion__id_negocio=id_negocio,
            fecha_creado__gte=since
        ).order_by("fecha_creado")

        historico = []
        for c in canjes_qs:
            promo = c.id_promocion
            monto_desc = f"{promo.porcentaje:.2f}%" if promo.tipo == "porcentaje" else str(promo.precio)
            historico.append({
                "fecha_hora": c.fecha_creado.isoformat(),
                "titulo": promo.nombre,
                "monto_de_descuento": monto_desc,
            })

        data = {
            "num_canjes_total_de_todas_las_promociones": str(total_canjes),
            "5_promociones_con_mas_canjes": top5_out,
            "historico_de_canjes_ultimos_siete_dias": historico,
            "5_promociones_con_menos_canjes": bottom5_out,
        }

        return Response(data, status=status.HTTP_200_OK)


# =============================================================================
# Clase: PromocionCreateView
# Descripción:
#   Permite la creación de promociones desde el panel del colaborador.
# =============================================================================
class PromocionCreateView(generics.CreateAPIView):
    """Crea una nueva promoción vinculada al negocio del usuario autenticado."""
    queryset = Promocion.objects.all()
    serializer_class = PromocionCreateSerializer
    permission_classes = [permissions.AllowAny]


# =============================================================================
# Clase: PromocionUpdateCompleteView
# Descripción:
#   Permite la actualización completa de los datos de una promoción existente.
# =============================================================================
class PromocionUpdateCompleteView(generics.UpdateAPIView):
    """Actualiza todos los campos de una promoción específica."""
    queryset = Promocion.objects.all()
    serializer_class = PromocionCreateSerializer
    permission_classes = [permissions.AllowAny]


# =============================================================================
# Clase: CreateCajeroView
# Descripción:
#   Permite registrar un nuevo cajero asociado a un negocio existente.
# =============================================================================
class CreateCajeroView(generics.CreateAPIView):
    """Crea un cajero vinculado al negocio del administrador autenticado."""
    permission_classes = [permissions.AllowAny]
    queryset = Cajero.objects.all()
    serializer_class = AltaCajeroSerializer
