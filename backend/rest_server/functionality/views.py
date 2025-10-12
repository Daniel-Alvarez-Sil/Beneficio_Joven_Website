from .utils.colaboradores import (AdministradorNegocioCreateView, PromocionListView, 
                    PromocionDeleteView, PromocionUpdateView, PromocionCreateView, 
                    EstadisticasNegocioView)

from rest_framework import permissions
from rest_framework.generics import ListAPIView
from .models import SolicitudNegocio
from .serializers import SolicitudNegocioSerializer

class SolicitudNegocioListView(ListAPIView):
    """
    GET /functionality/solicitudes-negocio/?id_negocio=<id>&estatus=<texto>
    """
    serializer_class = SolicitudNegocioSerializer
    permission_classes = [permissions.AllowAny]  # adjust if you want it public

    def get_queryset(self):
        qs = (SolicitudNegocio.objects
              .select_related("id_negocio")
              .order_by("-id"))

        id_negocio = self.request.query_params.get("id_negocio")
        if id_negocio:
            qs = qs.filter(id_negocio_id=id_negocio)

        estatus = self.request.query_params.get("estatus")
        if estatus:
            qs = qs.filter(estatus__iexact=estatus)

        return qs


