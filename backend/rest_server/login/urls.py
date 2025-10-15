from django.contrib import admin
from django.urls import path
from login.views import LoginView, ValidateTokenView, RefreshTokenView, UsuarioRegisterAPIView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('login/', LoginView.as_view(), name='login'),
    path('validate-token/', ValidateTokenView.as_view(), name='validate-token'),
    path('refresh-token/', RefreshTokenView.as_view(), name='refresh-token'),
    path('register/', UsuarioRegisterAPIView.as_view(), name='register'),  # New registration endpoint
]
