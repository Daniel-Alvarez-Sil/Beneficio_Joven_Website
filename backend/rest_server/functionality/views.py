from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from .serializers import AltaNegocioYAdminSerializer, PromocionListSerializer

from .models import Promocion

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


class PromocionListView(generics.ListAPIView):
    queryset = Promocion.objects.only(
        "titulo", "descripcion", "inicio_promocion", "final_promocion",
        "tipo", "monto", "estatus", "numero_canjeados"
    )
    serializer_class = PromocionListSerializer
    permission_classes = [permissions.AllowAny]  # switch to IsAuthenticated if needed
    pagination_class = None  # return ALL rows (no pagination)


# Petición para cambiar el estatus de una promoción (activar/desactivar)

# Petición para añadir una promoción 

# Petición para consumir estadísticas 