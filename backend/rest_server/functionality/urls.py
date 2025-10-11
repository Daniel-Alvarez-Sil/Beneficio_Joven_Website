from django.urls import path
from .views import AdministradorNegocioCreateView

urlpatterns = [
    path("administradores-negocio/", AdministradorNegocioCreateView.as_view(), name="administrador-negocio-create"),
]
