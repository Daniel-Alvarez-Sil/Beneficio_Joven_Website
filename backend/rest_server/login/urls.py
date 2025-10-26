# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción:
#   Este archivo define las rutas principales del proyecto Django relacionadas
#   con la autenticación y el registro de usuarios. Incluye endpoints para
#   iniciar sesión, validar tokens, refrescar tokens y registrar nuevos usuarios.
# =============================================================================

from django.contrib import admin
from django.urls import path
from login.views import (
    LoginView,
    ValidateTokenView,
    RefreshTokenView,
    UsuarioRegisterAPIView
)

# =============================================================================
# Definición de rutas (URL patterns)
# -----------------------------------------------------------------------------
# Cada ruta está asociada a una vista basada en clase (APIView) del módulo login.
# Estas rutas permiten gestionar el flujo de autenticación OAuth2 dentro del sistema.
# =============================================================================
urlpatterns = [
    # Ruta al panel de administración de Django
    path('admin/', admin.site.urls),

    # Endpoint para autenticación de usuarios (obtención de token)
    path('login/', LoginView.as_view(), name='login'),

    # Endpoint para validar un token OAuth2 existente
    path('validate-token/', ValidateTokenView.as_view(), name='validate-token'),

    # Endpoint para refrescar un token OAuth2 utilizando el refresh_token
    path('refresh-token/', RefreshTokenView.as_view(), name='refresh-token'),

    # Endpoint para registrar un nuevo usuario en el sistema
    path('register/', UsuarioRegisterAPIView.as_view(), name='register'),
]
