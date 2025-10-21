from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from ...models import CodigoQR, Negocio, Promocion, AdministradorNegocio, Suscripcion, Categoria, Usuario, Apartado
from login.models import User
from django.utils import timezone
from .serializers import NegocioSerializer, PromocionSerializer, CategoriaSerializer, UsuarioSerializer
from django.db.models import Q
# Generics
from rest_framework import generics

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

class SuscripcionANegocioView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        id_usuario = request.user.id
        id_negocio = request.data.get('id_negocio')
        try:
            suscripcion = Suscripcion.objects.get(id_usuario_id=id_usuario, id_negocio_id=id_negocio)
            suscripcion.delete()
            return Response({'message': 'Suscripción cancelada al negocio.'}, status=200)
        except Suscripcion.DoesNotExist:
            Suscripcion.objects.create(
                id_usuario_id=id_usuario,
                id_negocio_id=id_negocio,
            )
            return Response({'message': 'Suscripción exitosa al negocio.'}, status=200)
        
class ListPromocionSuscripcionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_usuario = request.user.id
        suscripciones = Suscripcion.objects.filter(id_usuario_id=id_usuario)
        promociones = Promocion.objects.filter(id_negocio_id__in=[s.id_negocio_id for s in suscripciones])
        serializer = PromocionSerializer(promociones, many=True)
        return Response(serializer.data, status=200)
    
class ListCategoriasView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategoriaSerializer
    queryset = Categoria.objects.all()

    def get_queryset(self):
        return Categoria.objects.all().order_by('id')

class ListUsuarioInfoView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        username = request.user.username
        usuario_obj = User.objects.get(username=username)
        id_usuario = usuario_obj.id if usuario_obj else None

        if not id_usuario:
            return Response({'detail': 'Usuario no autenticado.'}, status=401)

        try:
            usuario = Usuario.objects.get(id=id_usuario)
            serializer = UsuarioSerializer(usuario)
            return Response(serializer.data, status=200)
        except Usuario.DoesNotExist:
            return Response({'detail': 'Usuario no encontrado.'}, status=404)
        
class NegocioAndPromocionesViews(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            id_negocio = request.query_params.get('id_negocio')
            negocio = Negocio.objects.get(id=id_negocio)
            promociones = Promocion.objects.filter(id_negocio_id=id_negocio)

            negocio_serializer = NegocioSerializer(negocio)
            promociones_serializer = PromocionSerializer(promociones, many=True)

            data = {
                'negocio': negocio_serializer.data,
                'promociones': promociones_serializer.data
            }
            return Response(data, status=200)
        except Negocio.DoesNotExist:
            return Response({'detail': 'Negocio no encontrado.'}, status=404)
        
class ApartarPromocionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        id_usuario = request.user.id
        id_promocion = request.data.get('id_promocion')
        try:
            apartado = Apartado.objects.create(
                id_usuario_id=id_usuario,
                id_promocion_id=id_promocion,
                fecha_creado=timezone.now(),
                fecha_vigencia=None,
                estatus='sin canjear'
            )
            return Response({'message': 'Promoción apartada exitosamente.', 'id_apartado': apartado.id}, status=201)
        except Exception as e:
            return Response({'detail': 'Error al apartar la promoción.'}, status=400)
        
class ListPromocionesApartadasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_usuario = request.user.id
        apartados = Apartado.objects.filter(id_usuario_id=id_usuario)
        promociones = Promocion.objects.filter(id__in=[a.id_promocion_id for a in apartados])
        serializer = PromocionSerializer(promociones, many=True)
        return Response(serializer.data, status=200)