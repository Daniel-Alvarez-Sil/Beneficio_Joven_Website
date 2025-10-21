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
    id_negocio = NegocioForPromocionSerializer(read_only=True)
    categorias = CategoriaWithPromocionSerializer(many=True, read_only=True)

    class Meta:
        model = Promocion
        fields = '__all__'

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo', 'telefono']