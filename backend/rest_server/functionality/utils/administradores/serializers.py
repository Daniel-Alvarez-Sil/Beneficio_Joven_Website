
from rest_framework import serializers
from ...models import SolicitudNegocio, Negocio

class NegocioMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Negocio
        fields = ("id", "nombre", "correo", "telefono", "estatus")

class SolicitudNegocioSerializer(serializers.ModelSerializer):
    # Nested read-only data about the negocio
    negocio = NegocioMiniSerializer(source="id_negocio", read_only=True)

    class Meta:
        model = SolicitudNegocio
        fields = ("id", "estatus", "id_negocio", "negocio")