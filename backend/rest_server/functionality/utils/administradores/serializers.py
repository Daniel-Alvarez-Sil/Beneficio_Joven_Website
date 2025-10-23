
from rest_framework import serializers
from ...models import SolicitudNegocio, Negocio, Cajero, AdministradorNegocio

class NegocioMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Negocio
        fields = ("id", "nombre", "correo", "telefono", "estatus")

class CajeroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cajero
        fields = '__all__'

class SolicitudNegocioSerializer(serializers.ModelSerializer):
    # Nested read-only data about the negocio
    negocio = NegocioMiniSerializer(source="id_negocio", read_only=True)

    class Meta:
        model = SolicitudNegocio
        fields = ("id", "estatus", "id_negocio", "negocio")

class NegocioFullSerializer(serializers.ModelSerializer):
    class Meta:
        model = Negocio
        fields = '__all__'

class AdministradorNegocioFullSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdministradorNegocio
        fields = '__all__'
