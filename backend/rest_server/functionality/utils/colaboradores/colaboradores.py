from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from .serializers import (AltaNegocioYAdminSerializer, PromocionListSerializer, 
                          DeleteUpdatePromocionSerializer, PromocionCreateSerializer,
                          EstadisticasParamsSerializer, AltaCajeroSerializer)

from django.db import transaction, IntegrityError

from ...models import Promocion, Canje, AdministradorNegocio, Cajero, PromocionCategoria, CodigoQR, Apartado
from login.models import User

from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum

from ...models import Promocion


# Solicitud para crear un Negocio y su AdministradorNegocio asociado
class AdministradorNegocioCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = AltaNegocioYAdminSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(serializer.to_representation(result), status=status.HTTP_201_CREATED)

# Petición para consumir promociones
class PromocionListView(APIView):

    permission_classes = [permissions.AllowAny]  # switch to IsAuthenticated if needed

    def get(self, request, *args, **kwargs):
        # Accept id from query string (preferred) or JSON body (fallback)
        id_administrador_negocio = request.user.id if request.user and request.user.is_authenticated else None
        username = User.objects.get(id=id_administrador_negocio).username if id_administrador_negocio else None
        try: 
            administradorNegocio = AdministradorNegocio.objects.get(usuario=username) 
        except AdministradorNegocio.DoesNotExist:
            administradorNegocio = Cajero.objects.get(usuario=username)
        if administradorNegocio:
            print(administradorNegocio.id_negocio)
        else:
            return Response({"detail": "No se encontró el administrador de negocio."}, status=status.HTTP_404_NOT_FOUND)
        id_negocio = administradorNegocio.id_negocio if administradorNegocio else None

        promociones = Promocion.objects.filter(id_negocio=id_negocio).only(
            "id",
            "nombre", "descripcion", "fecha_inicio", "fecha_fin",
            "tipo", "porcentaje", "precio", "activo", "numero_canjeados", "imagen"
        )

        serializer = PromocionListSerializer(promociones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

   

# Petición para cambiar el estatus de una promoción (activar/desactivar)
class PromocionUpdateView(APIView):
    """
    POST /functionality/promociones/update/
    Body: {"id_promocion": "1", "activo": true}
    """
    # If you use OAuth, switch to IsAuthenticated
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = DeleteUpdatePromocionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"detail": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        promo_id = serializer.validated_data["id_promocion"]

        try:
            with transaction.atomic():
                promocion = Promocion.objects.select_for_update().get(pk=promo_id)
                actual_activo = promocion.activo
                promocion.activo = not actual_activo
                promocion.save()
            return Response({"detail": "Promoción actualizada"}, status=status.HTTP_200_OK)

        except Promocion.DoesNotExist:
            return Response({"detail": "Promoción no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        except IntegrityError:
            return Response(
                {"detail": "No se puede actualizar la promoción."},
                status=status.HTTP_409_CONFLICT
            )


# Petición para eliminar una promoción
class PromocionDeleteView(APIView):
    """
    POST /functionality/promociones/delete/
    Body: {"id_promocion": "1"}
    """
    # If you use OAuth, switch to IsAuthenticated
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = DeleteUpdatePromocionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"detail": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        promo_id = serializer.validated_data["id_promocion"]

        try:
            with transaction.atomic():
                promocioncategorias = PromocionCategoria.objects.filter(id_promocion=promo_id)
                promocioncategorias.delete()
                codigosqr = CodigoQR.objects.filter(id_promocion=promo_id)
                codigosqr.delete()
                canjes = Canje.objects.filter(id_promocion=promo_id)
                canjes.delete()
                apartados = Apartado.objects.filter(id_promocion=promo_id)
                apartados.delete()
                promocion = Promocion.objects.select_for_update().get(pk=promo_id)
                promocion.delete()
            return Response({"detail": "Promoción eliminada"}, status=status.HTTP_200_OK)

        except Promocion.DoesNotExist:
            return Response({"detail": "Promoción no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        except IntegrityError:
            # Happens if other tables reference this promo (FK constraints)
            return Response(
                {"detail": "No se puede eliminar: existen registros relacionados."},
                status=status.HTTP_409_CONFLICT
            )


# Petición para consumir estadísticas 
class EstadisticasNegocioView(APIView):
    """
    GET /functionality/promociones/estadisticas/?id_negocio=1
    Response:
    {
      "num_canjes_total_de_todas_las_promociones": "X",
      "5_promociones_con_mas_canjes": [{"titulo": "...", "numero_de_canjes": N}, ...],
      "historico_de_canjes_ultimos_siete_dias": [
          {"fecha_hora": "...", "titulo": "...", "monto_de_descuento": "..."},
          ...
      ],
      "5_promociones_con_menos_canjes": [{"titulo": "...", "numero_de_canjes": N}, ...]
    }
    """
    permission_classes = [permissions.AllowAny]  # switch to IsAuthenticated if needed

    def get(self, request, *args, **kwargs):
        id_administrador_negocio = request.user.id if request.user and request.user.is_authenticated else None
        username = User.objects.get(id=id_administrador_negocio).username if id_administrador_negocio else None
        print(username)
        administradorNegocio = AdministradorNegocio.objects.get(usuario=username) 
        if administradorNegocio:
            print(administradorNegocio.id_negocio)
        else:
            return Response({"detail": "No se encontró el administrador de negocio."}, status=status.HTTP_404_NOT_FOUND)
        id_negocio = administradorNegocio.id_negocio if administradorNegocio else None
        print(id_negocio)

        # ---- Totals & rankings from Promocion.numero_canjeados ----
        promos_qs = Promocion.objects.filter(id_negocio=id_negocio)

        total_canjes = promos_qs.aggregate(total=Sum("numero_canjeados"))["total"] or 0

        top5 = list(
            promos_qs.order_by("-numero_canjeados")
            .values("nombre", "numero_canjeados")[:5]
        )
        top5_out = [
            {"titulo": p["nombre"], "numero_de_canjes": p["numero_canjeados"]}
            for p in top5
        ]

        bottom5 = list(
            promos_qs.order_by("numero_canjeados")
            .values("nombre", "numero_canjeados")[:5]
        )
        bottom5_out = [
            {"titulo": p["nombre"], "numero_de_canjes": p["numero_canjeados"]}
            for p in bottom5
        ]

        # ---- Historico últimos 7 días (por eventos de canje) ----
        # Ajusta el filtro de estatus según tu catálogo real; aquí se asume 'canjeado'
        since = timezone.now() - timedelta(days=7)
        canjes_qs = (
            Canje.objects
            .select_related("id_promocion")
            .filter(id_promocion__id_negocio=id_negocio, fecha_creado__gte=since)
            .order_by("fecha_creado")
        )

        historico = []
        for c in canjes_qs:
            promo = c.id_promocion
            # Interpreta el monto de descuento según tu modelo:
            # - tipo='porcentaje' -> usa 'porcentaje' (e.g., "15.00%")
            # - tipo='precio'     -> usa 'precio' como monto fijo (e.g., "50.00000")
            if promo.tipo == "porcentaje" and promo.porcentaje is not None:
                monto_desc = f"{promo.porcentaje:.2f}%"
            else:
                # Asumimos 'precio' es el monto de descuento fijo
                # (si en tu negocio 'precio' es el PRECIO FINAL, cambia este cálculo)
                monto_desc = str(promo.precio)

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


class PromocionCreateView(generics.CreateAPIView):
    print("Entrando a PromocionCreateView")
    queryset = Promocion.objects.all()
    serializer_class = PromocionCreateSerializer
    # Adjust permissions as needed
    permission_classes = [permissions.AllowAny]  # or [permissions.AllowAny]

class PromocionUpdateCompleteView(generics.UpdateAPIView):
    print("Entrando a PromocionUpdateView")
    queryset = Promocion.objects.all()
    serializer_class = PromocionCreateSerializer
    # Adjust permissions as needed
    permission_classes = [permissions.AllowAny]  # or [permissions.AllowAny]

class CreateCajeroView(generics.CreateAPIView):
    print("Entrando a CreateCajeroView")
    permission_classes = [permissions.AllowAny]
    queryset = Cajero.objects.all()
    serializer_class = AltaCajeroSerializer

    # def post(self, request, *args, **kwargs):
    #     serializer = AltaCajeroSerializer(
    #         data=request.data, context={"request": request}
    #     )
    #     serializer.is_valid(raise_exception=True)
    #     result = serializer.save()
    #     return Response(serializer.to_representation(result), status=status.HTTP_201_CREATED)