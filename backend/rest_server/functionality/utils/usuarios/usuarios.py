from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from ...models import CodigoQR, Negocio, Promocion, AdministradorNegocio, Suscripcion, Categoria, Usuario, Apartado
from login.models import User
from django.utils import timezone
from .serializers import NegocioSerializer, PromocionSerializer, CategoriaSerializer, UsuarioSerializer, PromocionConApartadasSerializer
from django.db.models import Q
# Generics
from rest_framework import generics

class CodigoQRView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.user.username
        # id_usuario = request.data.get('id_usuario')
        id_usuario = Usuario.objects.get(correo=username).id


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
        serializer = PromocionConApartadasSerializer(promociones, many=True, context={'request': request})
        print(serializer.data)
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
        username = request.user.username
        id_promocion = request.data.get('id_promocion')
        id_usuario = Usuario.objects.get(correo=username).id
        try:
            apartado_existente = Apartado.objects.get(id_usuario_id=id_usuario, id_promocion_id=id_promocion)
            apartado_existente.delete()
            return Response({'message': 'Promoción removida de apartados exitosamente.'}, status=201)
        except Apartado.DoesNotExist:
            try:
                apartado = Apartado.objects.create(
                id_usuario_id=id_usuario,
                id_promocion_id=id_promocion,
                fecha_creado=timezone.now(),
                fecha_vigencia=None,
                estatus='sin canjear'
            )
                return Response({'message': 'Promoción apartada exitosamente.', 'id_apartado': apartado.id}, status=201)
            except Apartado.DoesNotExist:
                return Response({'detail': 'Error al apartar la promoción.'}, status=400)
        
class ListPromocionesApartadasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_usuario = request.user.id
        apartados = Apartado.objects.filter(id_usuario_id=id_usuario)
        promociones = Promocion.objects.filter(id__in=[a.id_promocion_id for a in apartados])
        serializer = PromocionSerializer(promociones, many=True)
        return Response(serializer.data, status=200)
    
class ListAllNegociosMapView(APIView):
    permission_classes = [AllowAny]

    """
    Response shape:
    {
      "businesses": [
        {
          "name": "Negocio Ejemplo 1",
          "url_maps": "https://maps.google.com/?q=19.4326,-99.1332",
          "address": "Calle Ejemplo 123, Colonia Centro, Ciudad de México, CDMX, CP 01000"
        }
      ]
    }
    """

    def get(self, request):
        negocios = (
            Negocio.objects
            .only(
                "nombre", "url_maps",
                "cp", "numero_ext", "numero_int",
                "colonia", "municipio", "estado"
                # If your model has a street field named "calle", the next line helps:
                # "calle"
            )
        )

        def format_address(n: Negocio) -> str:
            # Pull values safely; include "calle" if it exists in your model
            calle = getattr(n, "calle", None)
            numero_ext = (n.numero_ext or "").strip()
            numero_int = (n.numero_int or "").strip()
            colonia = (n.colonia or "").strip()
            municipio = (n.municipio or "").strip()
            estado = (n.estado or "").strip()
            cp = (n.cp or "").strip()

            # Build "Calle ... 123" if we have street or number info
            street_bits = []
            if calle:
                street_bits.append(calle)
            if numero_ext:
                street_bits.append(numero_ext)
            street = " ".join(street_bits) if street_bits else ""

            # Add "Int. X" when present
            if numero_int:
                street = (street + f", Int. {numero_int}").strip(", ")

            parts = []
            if street:
                parts.append(street)
            if colonia:
                parts.append(colonia)
            # Municipality + State
            city_state = ", ".join([p for p in [municipio, estado] if p])
            if city_state:
                parts.append(city_state)
            if cp:
                parts.append(f"CP {cp}")

            return ", ".join(parts)

        resultado = [
            {
                "name": n.nombre,
                "url_maps": n.url_maps or "",
                "address": format_address(n)
            }
            for n in negocios
        ]

        return Response({"businesses": resultado}, status=200)

