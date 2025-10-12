from django.urls import path
from .views import AdministradorNegocioCreateView, PromocionListView

urlpatterns = [
    path("administradores-negocio/", AdministradorNegocioCreateView.as_view(), name="administrador-negocio-create"),
    path("list/promociones/", PromocionListView.as_view(), name="promocion-list"),
]
