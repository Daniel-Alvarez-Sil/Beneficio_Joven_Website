from rest_framework import serializers
from ...models import CodigoQR, Negocio, Promocion, Categoria, Usuario, Apartado

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
    categorias = CategoriaWithPromocionSerializer(many=True, read_only=True)
    negocio_nombre = serializers.CharField(source='id_negocio.nombre', read_only=True)
    negocio_logo = serializers.ImageField(source='id_negocio.logo', read_only=True, allow_null=True)


    class Meta:
        model = Promocion
        fields = '__all__'

class PromocionConApartadasSerializer(serializers.ModelSerializer):
    categorias = CategoriaWithPromocionSerializer(many=True, read_only=True)
    negocio_nombre = serializers.CharField(source='id_negocio.nombre', read_only=True)
    negocio_logo = serializers.ImageField(source='id_negocio.logo', read_only=True, allow_null=True)


    class Meta:
        model = Promocion
        fields = '__all__'

    def to_representation(self, instance):
        request = self.context["request"]
        id_promocion = getattr(instance, 'id')
        username = request.user.username
        usuario = Usuario.objects.filter(correo=username).first()
        apartado_num = Apartado.objects.filter(id_usuario=usuario.id, id_promocion=id_promocion).count()
        return {
            **super().to_representation(instance),
            "es_apartado": True if apartado_num > 0 else False
        }



class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo', 'telefono']