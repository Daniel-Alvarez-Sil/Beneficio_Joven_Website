from rest_framework import generics, permissions
from .models import AdministradorNegocio  # adjust import path
from .serializers import AdministradorNegocioSerializer

class AdministradorNegocioCreateView(generics.CreateAPIView):
    queryset = AdministradorNegocio.objects.all()
    serializer_class = AdministradorNegocioSerializer
    permission_classes = [permissions.AllowAny]  # optional; keep/remove as you need
