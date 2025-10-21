from rest_framework import serializers
from ...models import CodigoQR, Negocio, Promocion, Categoria, Usuario

class NegocioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Negocio
        fields = '__all__'

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class CategoriaWithPromocionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['titulo']

class NegocioForPromocionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Negocio
        fields = ['id', 'nombre', 'logo']

class PromocionSerializer(serializers.ModelSerializer):
    negocio_nombre = serializers.CharField(source='id_negocio.nombre', read_only=True)
    negocio_logo = serializers.ImageField(source='id_negocio.logo', read_only=True, allow_null=True)

    class Meta:
        model = Promocion
        fields = '__all__'

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo', 'telefono']