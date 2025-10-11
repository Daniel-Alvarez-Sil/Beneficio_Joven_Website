from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegistroColaboradorView,
    RegistroSolicitudNegocioView,
    PromocionViewSet,
    EstadisticasNegocioView
)

router = DefaultRouter()
router.register(r"promociones", PromocionViewSet, basename="promocion")

urlpatterns = [
    # Colaborador
    path("colaborador/registro/", RegistroColaboradorView.as_view(), name="registro-colaborador"),

    # Solicitud de negocio
    path("negocios/solicitudes/", RegistroSolicitudNegocioView.as_view(), name="registro-solicitud-negocio"),

    # Estadísticas
    path("negocios/<int:id_negocio>/estadisticas/", EstadisticasNegocioView.as_view(), name="estadisticas-negocio"),

    # Promociones CRUD + acciones
    path("", include(router.urls)),
]
