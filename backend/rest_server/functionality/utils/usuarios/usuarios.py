from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from ...models import CodigoQR, Negocio, Promocion, AdministradorNegocio
from login.models import User
from django.utils import timezone
from .serializers import NegocioSerializer, PromocionSerializer
from django.db.models import Q

class CodigoQRView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        id_usuario = request.data.get('id_usuario')
        id_promocion = request.data.get('id_promocion')
        codigo_qr = CodigoQR.objects.create(
            id_usuario_id=id_usuario,
            id_promocion_id=id_promocion,
            codigo=f"QR-{id_usuario}-{id_promocion}",
            fecha_creado=timezone.now()
        )
        return Response({'id_canje': codigo_qr.id, 'message': codigo_qr.codigo, 'fecha_creado': timezone.localtime(codigo_qr.fecha_creado)}, status=201)

class ListNegociosView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        busqueda = request.query_params.get('busqueda', '')
        if busqueda:
            negocios = Negocio.objects.filter(nombre__icontains=busqueda)
        else:
            negocios = Negocio.objects.all()
    
        serializer = NegocioSerializer(negocios, many=True)
        return Response(serializer.data, status=200)
    
class ListPromocionesView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        id_negocio = request.query_params.get('id_negocio')
        busqueda = request.query_params.get('busqueda')
        categoria = request.query_params.get('categoria')
        
        filters = Q()
        if id_negocio:
            filters &= Q(id_negocio_id=id_negocio)
        if busqueda:
            filters &= Q(nombre__icontains=busqueda)
        if categoria:
            filters &= Q(id_categoria_titulo=categoria)

        promociones = Promocion.objects.all()
        serializer = PromocionSerializer(promociones, many=True)
        return Response(serializer.data, status=200)

