# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción:
#   Este módulo define los serializadores utilizados para transformar los
#   modelos del sistema (Negocio, Promoción, Categoría, Usuario y Apartado)
#   en representaciones JSON legibles por la API REST.
#
#   Se incluyen serializadores específicos para mostrar información combinada
#   (por ejemplo, promociones con sus categorías y estado de apartado).
# =============================================================================

from rest_framework import serializers
from ...models import CodigoQR, Negocio, Promocion, Categoria, Usuario, Apartado


# =============================================================================
# Clase: NegocioSerializer
# Descripción:
#   Serializador general para el modelo Negocio. Devuelve todos los campos.
# =============================================================================
class NegocioSerializer(serializers.ModelSerializer):
    """Serializa todos los campos del modelo Negocio."""

    class Meta:
        model = Negocio
        fields = '__all__'


# =============================================================================
# Clase: CategoriaSerializer
# Descripción:
#   Serializador general para las categorías. Devuelve todos los campos.
# =============================================================================
class CategoriaSerializer(serializers.ModelSerializer):
    """Serializa todos los campos del modelo Categoria."""

    class Meta:
        model = Categoria
        fields = '__all__'


# =============================================================================
# Clase: CategoriaWithPromocionSerializer
# Descripción:
#   Versión simplificada del serializador de categoría.
#   Solo incluye el título, útil para mostrar dentro de promociones.
# =============================================================================
class CategoriaWithPromocionSerializer(serializers.ModelSerializer):
    """Serializa únicamente el título de la categoría asociada a una promoción."""

    class Meta:
        model = Categoria
        fields = ['titulo']


# =============================================================================
# Clase: NegocioForPromocionSerializer
# Descripción:
#   Serializador reducido del modelo Negocio. Utilizado para mostrar información
#   básica del negocio en el contexto de una promoción.
# =============================================================================
class NegocioForPromocionSerializer(serializers.ModelSerializer):
    """Serializa datos básicos del negocio (id, nombre, logo)."""

    class Meta:
        model = Negocio
        fields = ['id', 'nombre', 'logo']


# =============================================================================
# Clase: PromocionSerializer
# Descripción:
#   Serializa promociones junto con su negocio y categorías relacionadas.
# =============================================================================
class PromocionSerializer(serializers.ModelSerializer):
    """Serializa el modelo Promoción incluyendo negocio y categorías."""

    # Relación con categorías (solo título)
    categorias = CategoriaWithPromocionSerializer(many=True, read_only=True)

    # Campos derivados del negocio relacionado
    negocio_nombre = serializers.CharField(source='id_negocio.nombre', read_only=True)
    negocio_logo = serializers.ImageField(source='id_negocio.logo', read_only=True, allow_null=True)

    class Meta:
        model = Promocion
        fields = '__all__'


# =============================================================================
# Clase: PromocionConApartadasSerializer
# Descripción:
#   Serializa promociones e indica si el usuario autenticado tiene la promoción
#   apartada (es_apartado = True/False).
# =============================================================================
class PromocionConApartadasSerializer(serializers.ModelSerializer):
    """Serializa promociones incluyendo categorías y estado de apartado."""

    categorias = CategoriaWithPromocionSerializer(many=True, read_only=True)
    negocio_nombre = serializers.CharField(source='id_negocio.nombre', read_only=True)
    negocio_logo = serializers.ImageField(source='id_negocio.logo', read_only=True, allow_null=True)

    class Meta:
        model = Promocion
        fields = '__all__'

    def to_representation(self, instance):
        """
        Extiende la representación del modelo para incluir si el usuario
        actual tiene la promoción apartada.
        """
        request = self.context["request"]
        id_promocion = getattr(instance, 'id')
        username = request.user.username

        # Se obtiene el usuario correspondiente al correo autenticado
        usuario = Usuario.objects.filter(correo=username).first()

        # Verifica si existe un registro de Apartado para esta promoción
        apartado_num = Apartado.objects.filter(
            id_usuario=usuario.id,
            id_promocion=id_promocion
        ).count()

        return {
            **super().to_representation(instance),
            "es_apartado": apartado_num > 0
        }


# =============================================================================
# Clase: UsuarioSerializer
# Descripción:
#   Serializa información básica del usuario, omitiendo datos sensibles.
# =============================================================================
class UsuarioSerializer(serializers.ModelSerializer):
    """Serializa información no sensible del modelo Usuario."""

    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo', 'telefono']
