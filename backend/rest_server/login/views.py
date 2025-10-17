from rest_framework import generics
from rest_framework.views import APIView

# Login with Cookies
from rest_framework.response import Response
from rest_framework import status

from rest_framework import generics
from rest_framework.permissions import AllowAny
import requests
from django.conf import settings
from oauth2_provider.models import AccessToken
from oauth2_provider.contrib.rest_framework import TokenHasReadWriteScope
from .models import User

from .serializers import UsuarioRegisterSerializer


# Login View
# This view handles user login and returns an OAuth2 token
# It does not require authentication, allowing any user to log in
class LoginView(APIView):
    authentication_classes = []  # Disable authentication
    permission_classes = [AllowAny]  # Allow any user (even unauthenticated)
    def post(self, request):      

        username = request.data.get('username')
        password = request.data.get('password')

        usuario = User.objects.filter(username=username).first()
        if not usuario:
            return Response({'error': 'Invalid credentials or user type'}, status=status.HTTP_401_UNAUTHORIZED)

        token_url = request.build_absolute_uri('/o/token/')
        data = {
            'grant_type': 'password',
            'username': username,
            'password': password,
            'client_id': settings.OAUTH_CLIENT_ID,
            'client_secret': settings.OAUTH_CLIENT_SECRET
        }

        response = requests.post(token_url, data=data)

        print(token_url)

        if response.status_code == 200:
            # Return the response and the user's role
            tipo = usuario.tipo
            response_data = response.json()
            response_data['tipo'] = tipo
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid credentials'}, status=response.status_code)

# Validate Token View
# This view checks if a given token is valid and returns user details if it is
class ValidateTokenView(APIView):
    authentication_classes = []  # Token is manually checked
    permission_classes = []      # We skip default auth for custom validation

    def get(self, request, *args, **kwargs):
        auth_header = request.headers.get('Authorization', '')

        if not auth_header.startswith('Bearer '):
            return Response({'error': 'Missing or invalid Authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token_string = auth_header.split(' ')[1]

        try:
            token = AccessToken.objects.select_related('user').get(token=token_string)
        except AccessToken.DoesNotExist:
            return Response({'error': 'Token not found'}, status=status.HTTP_401_UNAUTHORIZED)

        if not token.is_valid():
            return Response({'error': 'Token is invalid or expired'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response({
            'message': 'Token is valid',
            'user_id': token.user.id,
            'username': token.user.username,
        })

# Refresh Token View
# This view allows refreshing an OAuth2 token
# It requires a valid token to be passed in the Authorization header
class RefreshTokenView(APIView):
    authentication_classes = []  # Token is manually checked
    permission_classes = []      # We skip default auth for custom validation

    def post(self, request, *args, **kwargs):
        auth_header = request.headers.get('Authorization', '')

        if not auth_header.startswith('Bearer '):
            return Response({'error': 'Missing or invalid Authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token_string = auth_header.split(' ')[1]

        try:
            token = AccessToken.objects.get(token=token_string)
        except AccessToken.DoesNotExist:
            return Response({'error': 'Token not found'}, status=status.HTTP_401_UNAUTHORIZED)

        # if not token.is_valid():
        #     return Response({'error': 'Token is invalid or expired'}, status=status.HTTP_401_UNAUTHORIZED)

        # Refresh the token logic here
        token_url = request.build_absolute_uri('/usuarios/o/token/')
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': token.refresh_token,
            'client_id': settings.OAUTH_CLIENT_ID,
            'client_secret': settings.OAUTH_CLIENT_SECRET
        }

        response = requests.post(token_url, data=data)

        print(token_url)

        if response.status_code == 200:
            return Response(response.json(), status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid credentials'}, status=response.status_code)


# View to register a new 'usuario' user
class UsuarioRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UsuarioRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_201_CREATED)
