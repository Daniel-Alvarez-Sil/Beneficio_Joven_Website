from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from .models import AdministradorNegocio, Negocio  # adjust import path

class AdministradorNegocioSerializer(serializers.ModelSerializer):
    # Accept null for id_negocio if your DB allows it
    id_negocio = serializers.PrimaryKeyRelatedField(
        queryset=Negocio.objects.all(),
        required=False,
        allow_null=True
    )
    id = serializers.IntegerField(read_only=True)
    contrasena = serializers.CharField(write_only=True)

    class Meta:
        model = AdministradorNegocio
        fields = [
            "id",
            "id_negocio",
            "correo",
            "telefono",
            "nombre",
            "apellido_paterno",
            "apellido_materno",
            "usuario",
            "contrasena",
        ]

    def validate(self, attrs):
        User = get_user_model()
        username = attrs.get("usuario")
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"usuario": "Ya existe un usuario con ese nombre."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        User = get_user_model()

        # Prepare fields
        username = validated_data.get("usuario")
        email = validated_data.get("correo")
        raw_password = validated_data.get("contrasena")

        # 1) Create the Django auth user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=raw_password
        )
        user.tipo = "colaborador"  # value from your choices
        user.save(update_fields=["tipo"])

        # 2) Create AdministradorNegocio (id is read-only; DB should autogenerate it)
        admin = AdministradorNegocio.objects.create(**validated_data)
        return admin
