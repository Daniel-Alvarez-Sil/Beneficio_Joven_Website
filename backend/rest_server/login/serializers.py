# apps/usuarios/api/serializers.py
from typing import Optional
import uuid
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from functionality.models import Usuario  # adjust import to your app

def gen_folio() -> str:
    return f"USU-{uuid.uuid4().hex[:12].upper()}"

class UsuarioRegisterSerializer(serializers.Serializer):
    # Required
    correo = serializers.EmailField()
    contrasena = serializers.CharField(write_only=True, min_length=6)
    nombre = serializers.CharField(max_length=100)
    apellido_paterno = serializers.CharField(max_length=100, required=False, allow_blank=True)
    apellido_materno = serializers.CharField(max_length=100, required=False, allow_blank=True)

    # Optional domain fields
    genero = serializers.CharField(max_length=20, required=False, allow_blank=True)
    nacimiento = serializers.DateField(required=False, allow_null=True)

    # Address (received as requested)
    calle = serializers.CharField(max_length=200, required=False, allow_blank=True)  # NOT persisted (no column)
    numero = serializers.CharField(max_length=10, required=False, allow_blank=True)  # maps to numero_ext
    colonia = serializers.CharField(max_length=120, required=False, allow_blank=True)
    cp = serializers.CharField(max_length=5, required=False, allow_blank=True)
    municipio = serializers.CharField(max_length=120, required=False, allow_blank=True, allow_null=True)
    estado = serializers.CharField(max_length=120, required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        User = get_user_model()
        correo = attrs["correo"]

        # Uniqueness: do not allow duplicate auth usernames
        if User.objects.filter(username=correo).exists():
            raise serializers.ValidationError({"correo": "Ya existe un usuario de autenticación con este correo."})

        # Optional: also check your legacy 'usuario' table for same correo (if you want to enforce uniqueness there too)
        if Usuario.objects.filter(correo=correo).exists():
            raise serializers.ValidationError({"correo": "Ya existe un registro en la tabla usuario con este correo."})

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        User = get_user_model()

        correo = validated_data["correo"]
        contrasena = validated_data["contrasena"]
        nombre = validated_data.get("nombre", "")
        ap_pat = validated_data.get("apellido_paterno", "")
        ap_mat = validated_data.get("apellido_materno", "")

        genero = validated_data.get("genero", "")
        nacimiento = validated_data.get("nacimiento", None)

        # address fields
        calle = validated_data.get("calle", "")            # received but NOT persisted (no field in model)
        numero = validated_data.get("numero", "")          # -> numero_ext
        colonia = validated_data.get("colonia", "")
        cp = validated_data.get("cp", "")
        municipio: Optional[str] = validated_data.get("municipio")
        estado: Optional[str] = validated_data.get("estado")

        # 1) Create Django auth user (your custom User)
        auth_user = User.objects.create_user(
            username=correo,
            email=correo,
            password=contrasena,
            first_name=nombre,
            last_name=f"{ap_pat} {ap_mat}".strip(),
            tipo="usuario",  # your custom field default, set explicitly
        )

        # 2) Create legacy 'usuario' row
        usuario = Usuario.objects.create(
            correo=correo,
            telefono=None,
            nombre=nombre,
            apellido_paterno=ap_pat or None,
            apellido_materno=ap_mat or None,
            # Store as provided; if you want to hash this column, use:
            # contrasena=make_password(contrasena),
            contrasena=contrasena,
            curp=None,
            nacimiento=nacimiento,
            genero=genero or None,
            celular=None,
            cp=cp or None,
            numero_ext=numero or None,
            numero_int=None,
            colonia=colonia or None,
            municipio=municipio or None,
            estado=estado or None,
            fecha_creado=timezone.now(),
            folio=gen_folio(),
        )

        # You can return whatever you need; keep passwords out of the response
        return {
            "usuario_id": usuario.pk,
            "auth_user_id": auth_user.pk,
            "username": auth_user.username,
            "calle_recibida_no_persistida": calle,  # echo back for transparency
        }
