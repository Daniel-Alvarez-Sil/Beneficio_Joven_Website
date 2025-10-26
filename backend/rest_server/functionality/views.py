# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción:
#   Este módulo centraliza la importación de las vistas (Views) utilizadas en la
#   aplicación. La organización está dividida por roles de usuario (colaboradores,
#   administradores, cajeros y usuarios) y por funcionalidad (manejo de imágenes).
#
#   Estructura modular:
#     - Colaboradores: administración de promociones y cajeros.
#     - Administradores: gestión de negocios, solicitudes y métricas globales.
#     - Cajeros: validación de códigos QR.
#     - Usuarios: exploración de negocios, promociones y suscripciones.
#     - Imágenes: carga y vinculación de archivos multimedia.
# =============================================================================


# =============================================================================
# Importaciones para vistas de Colaboradores
# -----------------------------------------------------------------------------
# Estas vistas permiten a los colaboradores (administradores de negocio)
# gestionar promociones, cajeros y estadísticas de su negocio.
# =============================================================================
from .utils.colaboradores.colaboradores import (
    AdministradorNegocioCreateView,
    PromocionListView,
    PromocionDeleteView,
    PromocionUpdateView,
    PromocionCreateView,
    EstadisticasNegocioView,
    CreateCajeroView,
    PromocionUpdateCompleteView,
)


# =============================================================================
# Importaciones para vistas de Administradores
# -----------------------------------------------------------------------------
# Estas vistas están destinadas a los administradores del sistema central.
# Permiten revisar solicitudes de nuevos negocios, generar reportes,
# estadísticas y visualizar métricas globales.
# =============================================================================
from .utils.administradores.administradores import (
    SolicitudNegocioListView,
    PromocionesPorNegocioUltimoMes,
    CanjesPorNegocioLastMonthView,
    TotalColaboradoresView,
    PromocionesActivasPorNegocioAPIView,
    EstadisticasHeaderView,
    NegociosResumenView,
    ReviewSolicitudNegocioAPIView,
    ListAllCajerosView,
    detalleNegocioView,
)


# =============================================================================
# Importaciones para vistas de Cajeros
# -----------------------------------------------------------------------------
# Vistas específicas para el personal cajero, orientadas a la validación
# y registro de canjes mediante códigos QR.
# =============================================================================
from .utils.cajeros.cajeros import (
    validarQRView,
)


# =============================================================================
# Importaciones para vistas de Usuarios
# -----------------------------------------------------------------------------
# Estas vistas permiten a los usuarios finales interactuar con la aplicación:
# explorar negocios, suscribirse, visualizar promociones, generar códigos QR
# y consultar sus datos personales o suscripciones.
# =============================================================================
from .utils.usuarios.usuarios import (
    CodigoQRView,
    ListNegociosView,
    ListPromocionesView,
    SuscripcionANegocioView,
    ListPromocionSuscripcionesView,
    ListCategoriasView,
    ListUsuarioInfoView,
    NegocioAndPromocionesViews,
    ApartarPromocionView,
    ListPromocionesApartadasView,
    ListAllNegociosMapView,
)


# =============================================================================
# Importaciones para vistas de Imágenes
# -----------------------------------------------------------------------------
# Vistas responsables de la carga de imágenes (archivos multimedia) para
# negocios y promociones, manejando almacenamiento y asociación con registros.
# =============================================================================
from .utils.imagenes.imagenes import (
    UploadPromocionWithFileView as PromocionCreateImageUploadView,
    UploadNegocioWithFileView as NegocioCreateImageUploadView,
)
