from django.urls import path

# Administrador View
from .views import (AdministradorNegocioCreateView, PromocionListView, 
                    PromocionDeleteView, PromocionUpdateView, PromocionCreateView, 
                    EstadisticasNegocioView, ReviewSolicitudNegocioAPIView, )

# Colaboradores Views
from .views import (PromocionesPorNegocioUltimoMes, SolicitudNegocioListView, CanjesPorNegocioLastMonthView,
                    TotalColaboradoresView, PromocionesActivasPorNegocioAPIView, 
                    EstadisticasHeaderView, NegociosResumenView, CreateCajeroView, 
                    ListAllCajerosView)

# Usuarios Views
from .views import (CodigoQRView, ListNegociosView, ListPromocionesView, SuscripcionANegocioView, 
                    ListPromocionSuscripcionesView, ListCategoriasView, ListUsuarioInfoView, 
                    NegocioAndPromocionesViews)

# Imagenes Upload Views
from .views import (PromocionCreateImageUploadView, NegocioCreateImageUploadView)

# Cajeros Views
from .views import validarQRView

urlpatterns = [
    # Registro Administrador Negocio
    # path("administradores-negocio/", AdministradorNegocioCreateView.as_view(), name="administrador-negocio-create"),
    path("administradores-negocio/", NegocioCreateImageUploadView.as_view(), name="administrador-negocio-create"),

    # Colaboradores
    path("list/promociones/", PromocionListView.as_view(), name="promocion-list"),
    path("promociones/delete/", PromocionDeleteView.as_view(), name="promocion-delete"),
    path("promociones/update/", PromocionUpdateView.as_view(), name="promocion-update"),
    # path("promociones/create/", PromocionCreateView.as_view(), name="promocion-create"),
    path("promociones/create/", PromocionCreateImageUploadView.as_view(), name="promocion-create"),
    path("promociones/estadisticas/", EstadisticasNegocioView.as_view(), name="estadisticas-negocio"),
    path("cajero/create/", CreateCajeroView.as_view(), name="create-cajero"),
    path("cajeros/list/", ListAllCajerosView.as_view(), name="list-all-cajeros"),

    # Administradores
    path("solicitudes-negocio/list/", SolicitudNegocioListView.as_view(), name="solicitudes-negocio-list"),
    path("promociones/por-negocio-ultimo-mes/", PromocionesPorNegocioUltimoMes.as_view(), name="promociones-por-negocio-ultimo-mes"),
    path("canjes/por-negocio-ultimo-mes/", CanjesPorNegocioLastMonthView.as_view(), name="canjes-por-negocio-ultimo-mes"),
    path("total-colaboradores/", TotalColaboradoresView.as_view(), name="total-colaboradores"),
    path("promociones/activas-por-negocio/", PromocionesActivasPorNegocioAPIView.as_view(), name="promociones-activas-por-negocio"),
    path("estadisticas/header/", EstadisticasHeaderView.as_view(), name="estadisticas-header"),
    path("negocios/resumen/", NegociosResumenView.as_view(), name="negocios-resumen"),
    path("solicitudes-negocio/review/", ReviewSolicitudNegocioAPIView.as_view(), name="review-solicitud-negocio"),

    # Usuarios
    path("usuario/codigo-qr/", CodigoQRView.as_view(), name="codigo-qr"),
    path("usuario/list/negocios/", ListNegociosView.as_view(), name="list-negocios"),
    path("usuario/list/promociones/", ListPromocionesView.as_view(), name="list-promociones"),
    path("usuario/suscripcion-negocio/", SuscripcionANegocioView.as_view(), name="suscripcion-negocio"),
    path("usuario/list/promociones-suscripciones/", ListPromocionSuscripcionesView.as_view(), name="list-promocion-suscripciones"),
    path("usuario/list/categorias/", ListCategoriasView.as_view(), name="list-categorias"),
    path("usuario/info/", ListUsuarioInfoView.as_view(), name="list-usuario-info"),
    path("usuario/negocio-y-promociones/", NegocioAndPromocionesViews.as_view(), name="negocio-and-promociones"),
    # Imagenes para pruebas
    # path("imagenes/upload/", UploadFileView.as_view(), name="upload-file"),

    # Cajeros
    path("cajero/validar-qr/", validarQRView.as_view(), name="validar-qr"),
]

