from django.urls import path
from .views import (AdministradorNegocioCreateView, PromocionListView, 
                    PromocionDeleteView, PromocionUpdateView, PromocionCreateView, 
                    EstadisticasNegocioView)

from .views import (PromocionesPorNegocioUltimoMes, SolicitudNegocioListView, CanjesPorNegocioLastMonthView,
                    TotalColaboradoresView, PromocionesActivasPorNegocioAPIView, 
                    EstadisticasHeaderView, NegociosResumenView)

urlpatterns = [
    path("administradores-negocio/", AdministradorNegocioCreateView.as_view(), name="administrador-negocio-create"),
    path("list/promociones/", PromocionListView.as_view(), name="promocion-list"),
    path("promociones/delete/", PromocionDeleteView.as_view(), name="promocion-delete"),
    path("promociones/update/", PromocionUpdateView.as_view(), name="promocion-update"),
    path("promociones/create/", PromocionCreateView.as_view(), name="promocion-create"),
    path("promociones/estadisticas/", EstadisticasNegocioView.as_view(), name="estadisticas-negocio"),
    path("solicitudes-negocio/list/", SolicitudNegocioListView.as_view(), name="solicitudes-negocio-list"),
    path("promociones/por-negocio-ultimo-mes/", PromocionesPorNegocioUltimoMes.as_view(), name="promociones-por-negocio-ultimo-mes"),
    path("canjes/por-negocio-ultimo-mes/", CanjesPorNegocioLastMonthView.as_view(), name="canjes-por-negocio-ultimo-mes"),
    path("total-colaboradores/", TotalColaboradoresView.as_view(), name="total-colaboradores"),
    path("promociones/activas-por-negocio/", PromocionesActivasPorNegocioAPIView.as_view(), name="promociones-activas-por-negocio"),
    path("estadisticas/header/", EstadisticasHeaderView.as_view(), name="estadisticas-header"),
    path("negocios/resumen/", NegociosResumenView.as_view(), name="negocios-resumen"),
]

