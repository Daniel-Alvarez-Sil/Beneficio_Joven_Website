from django.urls import path
from .views import (AdministradorNegocioCreateView, PromocionListView, 
                    PromocionDeleteView, PromocionUpdateView, PromocionCreateView, 
                    EstadisticasNegocioView)

urlpatterns = [
    path("administradores-negocio/", AdministradorNegocioCreateView.as_view(), name="administrador-negocio-create"),
    path("list/promociones/", PromocionListView.as_view(), name="promocion-list"),
    path("promociones/delete/", PromocionDeleteView.as_view(), name="promocion-delete"),
    path("promociones/update/", PromocionUpdateView.as_view(), name="promocion-update"),
    path("promociones/create/", PromocionCreateView.as_view(), name="promocion-create"),
    path("promociones/estadisticas/", EstadisticasNegocioView.as_view(), name="estadisticas-negocio"),
]
