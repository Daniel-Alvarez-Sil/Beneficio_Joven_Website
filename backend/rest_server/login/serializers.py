# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción:
#   Este módulo define los serializadores relacionados con la creación
#   (registro) de usuarios. Implementa validaciones de unicidad y crea tanto
#   un registro en el modelo de autenticación de Django como en la tabla
#   'usuario' del dominio funcional.
# =============================================================================

from typing import Optional
import uuid
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from functionality.models import Usuario  # Ajustar según la app real


# =============================================================================
# Función: gen_folio
# Descripción:
#   Genera un identificador único (folio) para cada usuario, utilizando UUID.
# =============================================================================
def gen_folio() -> str:
    """Genera un folio único con prefijo 'USU-' y 12 caracteres aleatorios."""
    return f"USU-{uuid.uuid4().hex[:12].upper()}"


# =============================================================================
# Clase: UsuarioRegisterSerializer
# Descripción:
#   Serializador para registrar un nuevo usuario. Valida los datos recibidos,
#   garantiza la unicidad del correo electrónico y crea tanto el usuario
#   autenticable (modelo User) como su contraparte en la tabla 'usuario'.
# =============================================================================
class UsuarioRegisterSerializer(serializers.Serializer):
    """
    Serializador para la creación de un nuevo usuario.

    Este serializador:
    - Valida que el correo no esté registrado previamente.
    - Crea una cuenta en el modelo de autenticación de Django.
    - Crea un registro paralelo en la tabla funcional 'usuario'.
    """

    # -------------------------------------------------------------------------
    # Campos requeridos
    # -------------------------------------------------------------------------
    correo = serializers.EmailField()
    contrasena = serializers.CharField(write_only=True, min_length=6)
    nombre = serializers.CharField(max_length=100)
    apellido_paterno = serializers.CharField(max_length=100, required=False, allow_blank=True)
    apellido_materno = serializers.CharField(max_length=100, required=False, allow_blank=True)

    # -------------------------------------------------------------------------
    # Campos opcionales (información personal)
    # -------------------------------------------------------------------------
    genero = serializers.CharField(max_length=20, required=False, allow_blank=True)
    nacimiento = serializers.DateField(required=False, allow_null=True)

    # -------------------------------------------------------------------------
    # Campos de dirección (no todos se persisten en el modelo)
    # -------------------------------------------------------------------------
    calle = serializers.CharField(max_length=200, required=False, allow_blank=True)  # No persistido
    numero = serializers.CharField(max_length=10, required=False, allow_blank=True)  # Mapea a numero_ext
    colonia = serializers.CharField(max_length=120, required=False, allow_blank=True)
    cp = serializers.CharField(max_length=5, required=False, allow_blank=True)
    municipio = serializers.CharField(max_length=120, required=False, allow_blank=True, allow_null=True)
    estado = serializers.CharField(max_length=120, required=False, allow_blank=True, allow_null=True)

    # -------------------------------------------------------------------------
    # Validación personalizada
    # -------------------------------------------------------------------------
    def validate(self, attrs):
        """
        Valida que el correo no esté registrado en el sistema.

        - Revisa duplicados tanto en el modelo de autenticación
          como en la tabla funcional 'usuario'.
        """
        User = get_user_model()
        correo = attrs["correo"]

        # Verificar existencia en el modelo de autenticación
        if User.objects.filter(username=correo).exists():
            raise serializers.ValidationError({
                "correo": "Ya existe un usuario de autenticación con este correo."
            })

        # Verificar existencia en la tabla funcional
        if Usuario.objects.filter(correo=correo).exists():
            raise serializers.ValidationError({
                "correo": "Ya existe un registro en la tabla usuario con este correo."
            })

        return attrs

    # -------------------------------------------------------------------------
    # Creación del usuario
    # -------------------------------------------------------------------------
    @transaction.atomic
    def create(self, validated_data):
        """
        Crea un nuevo usuario tanto en el modelo de autenticación
        como en el modelo funcional 'Usuario'.

        El proceso es atómico: si alguna operación falla,
        se revierte toda la transacción.
        """
        User = get_user_model()

        # Datos personales
        correo = validated_data["correo"]
        contrasena = validated_data["contrasena"]
        nombre = validated_data.get("nombre", "")
        ap_pat = validated_data.get("apellido_paterno", "")
        ap_mat = validated_data.get("apellido_materno", "")
        genero = validated_data.get("genero", "")
        nacimiento = validated_data.get("nacimiento", None)

        # Dirección
        calle = validated_data.get("calle", "")            # No se persiste
        numero = validated_data.get("numero", "")          # Mapea a numero_ext
        colonia = validated_data.get("colonia", "")
        cp = validated_data.get("cp", "")
        municipio: Optional[str] = validated_data.get("municipio")
        estado: Optional[str] = validated_data.get("estado")

        # ---------------------------------------------------------------------
        # 1) Crear usuario autenticable en el modelo User de Django
        # ---------------------------------------------------------------------
        auth_user = User.objects.create_user(
            username=correo,
            email=correo,
            password=contrasena,
            first_name=nombre,
            last_name=f"{ap_pat} {ap_mat}".strip(),
            tipo="usuario",  # Campo personalizado que define el rol
        )

        # ---------------------------------------------------------------------
        # 2) Crear registro funcional en la tabla Usuario
        # ---------------------------------------------------------------------
        usuario = Usuario.objects.create(
            correo=correo,
            telefono=None,
            nombre=nombre,
            apellido_paterno=ap_pat or None,
            apellido_materno=ap_mat or None,
            contrasena=contrasena,  # ⚠️ Si deseas mayor seguridad, usa make_password
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
            folio=gen_folio(),  # Genera un folio único por usuario
        )

        # ---------------------------------------------------------------------
        # Retorno
        # ---------------------------------------------------------------------
        # No se devuelve la contraseña por seguridad.
        # Se incluye 'calle' solo como referencia ya que no se guarda.
        return {
            "usuario_id": usuario.pk,
            "auth_user_id": auth_user.pk,
            "username": auth_user.username,
            "calle_recibida_no_persistida": calle,
        }
