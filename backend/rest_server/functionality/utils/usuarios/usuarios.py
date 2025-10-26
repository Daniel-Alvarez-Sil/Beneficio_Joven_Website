# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción:
#   Este módulo contiene las vistas relacionadas con las funcionalidades del
#   usuario final dentro de la aplicación. Incluye generación de códigos QR,
#   exploración de negocios, manejo de suscripciones, apartar promociones,
#   y obtener información de perfil.
# =============================================================================

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.db.models import Q

# Modelos
from ...models import (
    CodigoQR, Negocio, Promocion, AdministradorNegocio,
    Suscripcion, Categoria, Usuario, Apartado
)
from login.models import User

# Serializadores
from .serializers import (
    NegocioSerializer, PromocionSerializer,
    CategoriaSerializer, UsuarioSerializer,
    PromocionConApartadasSerializer
)


# =============================================================================
# Clase: CodigoQRView
# Descripción:
#   Genera un nuevo código QR asociado a una promoción y usuario específico.
# =============================================================================
class CodigoQRView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Crea un código QR para una promoción seleccionada por el usuario.

        El código incluye el ID del usuario y la promoción, con fecha de creación.
        """
        username = request.user.username
        id_usuario = Usuario.objects.get(correo=username).id
        id_promocion = request.data.get('id_promocion')

        codigo_qr = CodigoQR.objects.create(
            id_usuario_id=id_usuario,
            id_promocion_id=id_promocion,
            codigo=f"QR-{id_usuario}-{id_promocion}",
            fecha_creado=timezone.now()
        )

        return Response({
            'id_canje': codigo_qr.id,
            'message': codigo_qr.codigo,
            'fecha_creado': timezone.localtime(codigo_qr.fecha_creado)
        }, status=status.HTTP_201_CREATED)


# =============================================================================
# Clase: ListNegociosView
# Descripción:
#   Devuelve la lista de negocios registrados. Permite filtrar por nombre.
# =============================================================================
class ListNegociosView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Lista todos los negocios o filtra por nombre con el parámetro 'busqueda'.
        """
        busqueda = request.query_params.get('busqueda', '')
        negocios = Negocio.objects.filter(nombre__icontains=busqueda) if busqueda else Negocio.objects.all()
        serializer = NegocioSerializer(negocios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =============================================================================
# Clase: ListPromocionesView
# Descripción:
#   Retorna las promociones registradas. Puede filtrarse por negocio, búsqueda
#   por nombre o categoría.
# =============================================================================
class ListPromocionesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Devuelve una lista de promociones filtradas por negocio, búsqueda o categoría.
        """
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

        promociones = Promocion.objects.filter(filters)
        serializer = PromocionConApartadasSerializer(promociones, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# =============================================================================
# Clase: SuscripcionANegocioView
# Descripción:
#   Permite al usuario suscribirse o cancelar su suscripción a un negocio.
# =============================================================================
class SuscripcionANegocioView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Crea o elimina una suscripción del usuario autenticado a un negocio.
        """
        id_usuario = request.user.id
        id_negocio = request.data.get('id_negocio')

        try:
            suscripcion = Suscripcion.objects.get(id_usuario_id=id_usuario, id_negocio_id=id_negocio)
            suscripcion.delete()
            return Response({'message': 'Suscripción cancelada al negocio.'}, status=status.HTTP_200_OK)
        except Suscripcion.DoesNotExist:
            Suscripcion.objects.create(id_usuario_id=id_usuario, id_negocio_id=id_negocio)
            return Response({'message': 'Suscripción exitosa al negocio.'}, status=status.HTTP_200_OK)


# =============================================================================
# Clase: ListPromocionSuscripcionesView
# Descripción:
#   Muestra las promociones disponibles en los negocios a los que el usuario está suscrito.
# =============================================================================
class ListPromocionSuscripcionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Devuelve todas las promociones de los negocios a los que el usuario está suscrito.
        """
        id_usuario = request.user.id
        suscripciones = Suscripcion.objects.filter(id_usuario_id=id_usuario)
        promociones = Promocion.objects.filter(id_negocio_id__in=[s.id_negocio_id for s in suscripciones])
        serializer = PromocionSerializer(promociones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =============================================================================
# Clase: ListCategoriasView
# Descripción:
#   Lista todas las categorías disponibles ordenadas por su ID.
# =============================================================================
class ListCategoriasView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategoriaSerializer
    queryset = Categoria.objects.all().order_by('id')


# =============================================================================
# Clase: ListUsuarioInfoView
# Descripción:
#   Devuelve la información detallada del usuario autenticado.
# =============================================================================
class ListUsuarioInfoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Retorna los datos personales del usuario autenticado.
        """
        username = request.user.username
        usuario_obj = User.objects.filter(username=username).first()

        if not usuario_obj:
            return Response({'detail': 'Usuario no autenticado.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            usuario = Usuario.objects.get(id=usuario_obj.id)
            serializer = UsuarioSerializer(usuario)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Usuario.DoesNotExist:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)


# =============================================================================
# Clase: NegocioAndPromocionesViews
# Descripción:
#   Devuelve la información de un negocio y todas sus promociones activas.
# =============================================================================
class NegocioAndPromocionesViews(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Retorna la información de un negocio y sus promociones asociadas.
        """
        id_negocio = request.query_params.get('id_negocio')
        try:
            negocio = Negocio.objects.get(id=id_negocio)
            promociones = Promocion.objects.filter(id_negocio_id=id_negocio)

            negocio_serializer = NegocioSerializer(negocio)
            promociones_serializer = PromocionSerializer(promociones, many=True)

            return Response({
                'negocio': negocio_serializer.data,
                'promociones': promociones_serializer.data
            }, status=status.HTTP_200_OK)
        except Negocio.DoesNotExist:
            return Response({'detail': 'Negocio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)


# =============================================================================
# Clase: ApartarPromocionView
# Descripción:
#   Permite al usuario apartar o remover una promoción de su lista personal.
# =============================================================================
class ApartarPromocionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Agrega o elimina una promoción de la lista de apartados del usuario.
        """
        username = request.user.username
        id_promocion = request.data.get('id_promocion')
        id_usuario = Usuario.objects.get(correo=username).id

        try:
            apartado = Apartado.objects.get(id_usuario_id=id_usuario, id_promocion_id=id_promocion)
            apartado.delete()
            return Response({'message': 'Promoción removida de apartados exitosamente.'}, status=status.HTTP_201_CREATED)
        except Apartado.DoesNotExist:
            apartado = Apartado.objects.create(
                id_usuario_id=id_usuario,
                id_promocion_id=id_promocion,
                fecha_creado=timezone.now(),
                fecha_vigencia=None,
                estatus='sin canjear'
            )
            return Response({
                'message': 'Promoción apartada exitosamente.',
                'id_apartado': apartado.id
            }, status=status.HTTP_201_CREATED)


# =============================================================================
# Clase: ListPromocionesApartadasView
# Descripción:
#   Devuelve todas las promociones que el usuario ha apartado.
# =============================================================================
class ListPromocionesApartadasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Lista las promociones actualmente apartadas por el usuario autenticado.
        """
        id_usuario = request.user.id
        apartados = Apartado.objects.filter(id_usuario_id=id_usuario)
        promociones = Promocion.objects.filter(id__in=[a.id_promocion_id for a in apartados])
        serializer = PromocionSerializer(promociones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =============================================================================
# Clase: ListAllNegociosMapView
# Descripción:
#   Devuelve todos los negocios con su dirección formateada y enlace a Google Maps.
# =============================================================================
class ListAllNegociosMapView(APIView):
    permission_classes = [AllowAny]

    """
    Ejemplo de respuesta esperada:
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
        """
        Devuelve todos los negocios con su dirección formateada.
        Incluye nombre, URL de Google Maps y dirección completa.
        """
        negocios = Negocio.objects.only(
            "nombre", "url_maps", "cp", "numero_ext", "numero_int",
            "colonia", "municipio", "estado"
        )

        def format_address(n: Negocio) -> str:
            """Construye una dirección legible a partir de los campos del negocio."""
            calle = getattr(n, "calle", None)
            numero_ext = (n.numero_ext or "").strip()
            numero_int = (n.numero_int or "").strip()
            colonia = (n.colonia or "").strip()
            municipio = (n.municipio or "").strip()
            estado = (n.estado or "").strip()
            cp = (n.cp or "").strip()

            # Construcción de la cadena de dirección
            partes = []
            if calle or numero_ext:
                calle_str = " ".join([p for p in [calle, numero_ext] if p])
                if numero_int:
                    calle_str += f", Int. {numero_int}"
                partes.append(calle_str)
            if colonia:
                partes.append(colonia)
            if municipio or estado:
                partes.append(", ".join([p for p in [municipio, estado] if p]))
            if cp:
                partes.append(f"CP {cp}")

            return ", ".join(partes)

        resultado = [
            {"name": n.nombre, "url_maps": n.url_maps or "", "address": format_address(n)}
            for n in negocios
        ]

        return Response({"businesses": resultado}, status=status.HTTP_200_OK)
