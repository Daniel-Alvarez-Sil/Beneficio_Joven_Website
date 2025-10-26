# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción: Vistas relacionadas con la autenticación de usuarios mediante
# OAuth2, incluyendo login, validación y refresco de tokens, así como el
# registro de nuevos usuarios.
# =============================================================================

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import requests
from django.conf import settings
from oauth2_provider.models import AccessToken
from .models import User
from .serializers import UsuarioRegisterSerializer


# =============================================================================
# Clase: LoginView
# Descripción:
#   Permite el inicio de sesión de un usuario utilizando sus credenciales
#   (nombre de usuario y contraseña). Retorna un token OAuth2 junto con
#   el tipo de usuario para personalizar la experiencia del cliente.
# =============================================================================
class LoginView(APIView):
    authentication_classes = []  # Se desactiva la autenticación por defecto
    permission_classes = [AllowAny]  # Permite acceso sin autenticación previa

    def post(self, request):
        """
        Maneja la autenticación del usuario y genera un token OAuth2.

        Parámetros:
            - request (Request): Contiene los datos enviados por el cliente.
        
        Retorna:
            - Response: Objeto con los datos del token y el tipo de usuario.
        """
        username = request.data.get('username')
        password = request.data.get('password')

        # Verifica si el usuario existe en la base de datos
        usuario = User.objects.filter(username=username).first()
        if not usuario:
            return Response(
                {'error': 'Credenciales inválidas o tipo de usuario incorrecto'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Construye la URL del endpoint del token OAuth2
        token_url = request.build_absolute_uri('/o/token/')
        data = {
            'grant_type': 'password',
            'username': username,
            'password': password,
            'client_id': settings.OAUTH_CLIENT_ID,
            'client_secret': settings.OAUTH_CLIENT_SECRET
        }

        # Envía la solicitud al servidor OAuth2 para generar el token
        response = requests.post(token_url, data=data)

        if response.status_code == 200:
            # Si la autenticación fue exitosa, se agrega el tipo de usuario
            tipo = usuario.tipo
            response_data = response.json()
            response_data['tipo_web'] = tipo

            # Ajuste semántico para distinguir entre roles
            if tipo == 'cajero':
                tipo = 'colaborador'

            response_data['tipo'] = tipo
            return Response(response_data, status=status.HTTP_200_OK)

        return Response({'error': 'Credenciales inválidas'}, status=response.status_code)


# =============================================================================
# Clase: ValidateTokenView
# Descripción:
#   Permite validar manualmente un token de acceso OAuth2, verificando su
#   existencia y vigencia. Devuelve información básica del usuario asociado.
# =============================================================================
class ValidateTokenView(APIView):
    authentication_classes = []  # Validación manual del token
    permission_classes = []      # Sin permisos predefinidos (control manual)

    def get(self, request, *args, **kwargs):
        """
        Valida la autenticidad y vigencia de un token Bearer.

        Retorna:
            - 400 si el encabezado es inválido.
            - 401 si el token no existe o está expirado.
            - 200 si el token es válido, junto con datos del usuario.
        """
        auth_header = request.headers.get('Authorization', '')

        # Verifica el formato del encabezado Authorization
        if not auth_header.startswith('Bearer '):
            return Response(
                {'error': 'Encabezado Authorization ausente o inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        token_string = auth_header.split(' ')[1]

        try:
            # Busca el token y su usuario asociado
            token = AccessToken.objects.select_related('user').get(token=token_string)
        except AccessToken.DoesNotExist:
            return Response({'error': 'Token no encontrado'}, status=status.HTTP_401_UNAUTHORIZED)

        # Valida la vigencia del token
        if not token.is_valid():
            return Response({'error': 'Token inválido o expirado'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response({
            'message': 'Token válido',
            'user_id': token.user.id,
            'username': token.user.username,
        })


# =============================================================================
# Clase: RefreshTokenView
# Descripción:
#   Permite generar un nuevo token OAuth2 utilizando un refresh token válido.
#   Este proceso se realiza sin requerir autenticación adicional.
# =============================================================================
class RefreshTokenView(APIView):
    authentication_classes = []  # Validación manual
    permission_classes = []      # Control de permisos manual

    def post(self, request, *args, **kwargs):
        """
        Refresca el token de acceso utilizando el refresh_token proporcionado.

        Retorna:
            - 400 si el encabezado es inválido.
            - 401 si el token no existe o es inválido.
            - 200 con un nuevo token de acceso.
        """
        auth_header = request.headers.get('Authorization', '')

        # Validación básica del encabezado
        if not auth_header.startswith('Bearer '):
            return Response(
                {'error': 'Encabezado Authorization ausente o inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        token_string = auth_header.split(' ')[1]

        try:
            token = AccessToken.objects.get(token=token_string)
        except AccessToken.DoesNotExist:
            return Response({'error': 'Token no encontrado'}, status=status.HTTP_401_UNAUTHORIZED)

        # Construye la URL del endpoint de refresco de token
        token_url = request.build_absolute_uri('/usuarios/o/token/')
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': token.refresh_token,
            'client_id': settings.OAUTH_CLIENT_ID,
            'client_secret': settings.OAUTH_CLIENT_SECRET
        }

        response = requests.post(token_url, data=data)

        if response.status_code == 200:
            return Response(response.json(), status=status.HTTP_200_OK)

        return Response({'error': 'Error al refrescar el token'}, status=response.status_code)


# =============================================================================
# Clase: UsuarioRegisterAPIView
# Descripción:
#   Permite registrar un nuevo usuario en el sistema. Esta vista no requiere
#   autenticación previa y valida los datos usando el serializer asociado.
# =============================================================================
class UsuarioRegisterAPIView(APIView):
    permission_classes = [AllowAny]  # Permite el registro sin autenticación

    def post(self, request):
        """
        Crea un nuevo usuario a partir de los datos enviados en la solicitud.

        Retorna:
            - 201 si el usuario fue creado exitosamente.
            - 400 si existen errores de validación.
        """
        serializer = UsuarioRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_201_CREATED)
