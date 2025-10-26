# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción:
#   Serializadores para la creación, validación y administración de negocios,
#   promociones, cajeros y estadísticas de desempeño comercial.
#
#   Este módulo implementa validaciones personalizadas, creación atómica
#   de objetos relacionados y lógica de inferencia inteligente mediante IA.
# =============================================================================

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from ...models import (
    AdministradorNegocio, Negocio, SolicitudNegocio,
    Promocion, Cajero, PromocionCategoria
)
from login.models import User
from decimal import Decimal
from typing import Optional, Tuple
from django.core.exceptions import MultipleObjectsReturned
from functionality.utils.ai.automata import infer_promocion_fields
from django.db.models import Q


# =============================================================================
# Serializador: NegocioCreateSerializer
# Descripción:
#   Serializa los campos necesarios para crear un nuevo negocio.
# =============================================================================
class NegocioCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear instancias del modelo Negocio."""
    class Meta:
        model = Negocio
        fields = [
            "correo", "telefono", "nombre", "rfc", "sitio_web",
            "estatus", "cp", "numero_ext", "numero_int", "colonia",
            "municipio", "estado", "logo"
        ]


# =============================================================================
# Serializador: AdministradorNegocioInputSerializer
# Descripción:
#   Serializa la información del administrador vinculado a un negocio.
# =============================================================================
class AdministradorNegocioInputSerializer(serializers.ModelSerializer):
    """Serializer para capturar los datos del Administrador de Negocio."""
    contrasena = serializers.CharField(write_only=True)

    class Meta:
        model = AdministradorNegocio
        fields = [
            "correo", "telefono", "nombre", "apellido_paterno",
            "apellido_materno", "usuario", "contrasena"
        ]


# =============================================================================
# Serializador: AltaNegocioYAdminSerializer
# Descripción:
#   Crea un negocio y su administrador principal en una sola transacción.
# =============================================================================
class AltaNegocioYAdminSerializer(serializers.Serializer):
    """Crea un negocio junto con su administrador principal."""
    negocio = NegocioCreateSerializer()
    administrador = AdministradorNegocioInputSerializer()
    usuario = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    creado_por_admin = serializers.BooleanField(required=False, default=False, allow_null=True)

    def validate(self, attrs):
        """Evita la creación de usuarios duplicados."""
        User = get_user_model()
        username = attrs["administrador"]["usuario"]
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({
                "administrador": {"usuario": "Ya existe un usuario con ese nombre."}
            })
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        """Crea negocio, administrador y solicitud en una sola transacción."""
        request = self.context["request"]
        negocio_data = validated_data["negocio"]
        admin_data = validated_data["administrador"]

        negocio = Negocio.objects.create(
            **negocio_data,
            logo=self.context.get("logo_key"),
            fecha_creado=timezone.now(),
        )

        admin = AdministradorNegocio.objects.create(
            id_negocio=negocio,
            **admin_data
        )

        SolicitudNegocio.objects.create(
            id_negocio=negocio,
            estatus="aprobado" if validated_data.get("creado_por_admin", True) else "pendiente"
        )

        if validated_data.get("creado_por_admin", True):
            User.objects.create_user(
                username=admin_data["correo"],
                password=admin_data["contrasena"],
                tipo="colaborador"
            )

        return {"negocio": negocio, "administrador": admin}

    def to_representation(self, instance):
        """Representa la estructura del negocio creado y su administrador."""
        negocio = instance["negocio"]
        admin = instance["administrador"]
        return {
            "negocio": {
                "id": negocio.id,
                "nombre": negocio.nombre,
                "correo": negocio.correo,
                "telefono": negocio.telefono,
                "rfc": negocio.rfc,
                "sitio_web": negocio.sitio_web,
                "fecha_creado": negocio.fecha_creado.isoformat(),
                "estatus": negocio.estatus,
                "cp": negocio.cp,
                "numero_ext": negocio.numero_ext,
                "numero_int": negocio.numero_int,
                "colonia": negocio.colonia,
                "municipio": negocio.municipio,
                "estado": negocio.estado,
                "logo": self.context.get("logo_key"),
            },
            "administrador": {
                "id": admin.id,
                "id_negocio": negocio.id,
                "correo": admin.correo,
                "telefono": admin.telefono,
                "nombre": admin.nombre,
                "apellido_paterno": admin.apellido_paterno,
                "apellido_materno": admin.apellido_materno,
                "usuario": admin.usuario,
            },
        }


# =============================================================================
# Serializador: PromocionListSerializer
# Descripción:
#   Lista de promociones con información básica.
# =============================================================================
class PromocionListSerializer(serializers.ModelSerializer):
    """Serializer para listar promociones con información esencial."""
    class Meta:
        model = Promocion
        fields = (
            "id", "nombre", "descripcion", "fecha_inicio", "fecha_fin",
            "tipo", "porcentaje", "precio", "activo", "numero_canjeados", "imagen",
        )


# =============================================================================
# Serializador: DeleteUpdatePromocionSerializer
# Descripción:
#   Valida el ID de una promoción antes de eliminarla o actualizarla.
# =============================================================================
class DeleteUpdatePromocionSerializer(serializers.Serializer):
    """Valida el identificador de una promoción existente."""
    id_promocion = serializers.IntegerField(min_value=1)


# =============================================================================
# Serializador: PromocionCreateSerializer
# Descripción:
#   Valida y crea nuevas promociones asociadas a un negocio.
# =============================================================================
class PromocionCreateSerializer(serializers.ModelSerializer):
    """Permite crear promociones y asignar categorías inferidas por IA."""
    id_negocio = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    id = serializers.IntegerField(read_only=True)
    imagen = serializers.ImageField(read_only=True)

    class Meta:
        model = Promocion
        fields = (
            "id", "id_negocio", "nombre", "descripcion", "fecha_inicio", "fecha_fin",
            "imagen", "limite_por_usuario", "limite_total", "porcentaje", "precio", "activo",
        )

    def validate(self, attrs):
        """Valida las reglas de negocio antes de crear una promoción."""
        fi, ff = attrs.get("fecha_inicio"), attrs.get("fecha_fin")
        porcentaje = attrs.get("porcentaje", Decimal("0"))
        precio = attrs.get("precio", Decimal("0"))

        if fi and ff and ff < fi:
            raise serializers.ValidationError({"fecha_fin": "Debe ser mayor o igual a fecha_inicio."})
        if porcentaje < 0 or porcentaje > 100:
            raise serializers.ValidationError({"porcentaje": "Debe estar entre 0 y 100."})
        if precio < 0:
            raise serializers.ValidationError({"precio": "No puede ser negativo."})

        tipo = attrs.get("descripcion", "").split(':')[0].strip().lower()
        descripcion = attrs.get("descripcion", "").split(':')[1].strip() if ':' in attrs.get("descripcion", "") else attrs.get("descripcion", "")

        if porcentaje <= 0 and precio <= 0 and tipo not in ['2x1', 'trae un amigo', 'otra']:
            raise serializers.ValidationError("Debe especificar un porcentaje (> 0) o un precio (> 0).")

        attrs["descripcion"] = descripcion
        attrs["_tipo"] = tipo if tipo in ['2x1', 'trae un amigo', 'otra'] else (
            "porcentaje" if porcentaje > 0 else "precio"
        )
        return attrs

    def _resolve_negocio_y_admin(self, id_negocio_pk: Optional[int]) -> Negocio:
        """Obtiene el negocio ya sea desde el payload o el usuario autenticado."""
        if id_negocio_pk:
            try:
                return Negocio.objects.get(pk=id_negocio_pk)
            except Negocio.DoesNotExist:
                raise serializers.ValidationError({"id_negocio": "Negocio no encontrado."})

        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError({"id_negocio": "Usuario no autenticado."})

        username = User.objects.get(id=request.user.id).username
        try:
            administradorNegocio = AdministradorNegocio.objects.get(Q(usuario=username) | Q(correo=username))
        except AdministradorNegocio.DoesNotExist:
            administradorNegocio = Cajero.objects.get(Q(usuario=username) | Q(correo=username))
        except MultipleObjectsReturned:
            administradorNegocio = AdministradorNegocio.objects.filter(usuario=username).first()

        negocio = administradorNegocio.id_negocio
        return negocio if isinstance(negocio, Negocio) else Negocio.objects.get(pk=negocio)

    def create(self, validated_data):
        """Crea la promoción e infiere categorías usando IA."""
        id_negocio_pk = validated_data.pop("id_negocio", None)
        negocio = self._resolve_negocio_y_admin(id_negocio_pk)
        tipo = validated_data.pop("_tipo")
        validated_data.setdefault("numero_canjeados", 0)

        with transaction.atomic():
            promocion = Promocion.objects.create(
                id_negocio=negocio,
                tipo=tipo,
                **validated_data,
            )

            categorias_ai = infer_promocion_fields(
                nombre=promocion.nombre,
                descripcion=promocion.descripcion,
            )
            for cat_id in categorias_ai:
                PromocionCategoria.objects.create(
                    id_promocion=promocion,
                    id_categoria_id=cat_id
                )

        return promocion


# =============================================================================
# Serializador: EstadisticasParamsSerializer
# Descripción:
#   Valida los parámetros necesarios para generar estadísticas del negocio.
# =============================================================================
class EstadisticasParamsSerializer(serializers.Serializer):
    """Valida los parámetros requeridos para obtener estadísticas de negocio."""
    id_negocio = serializers.IntegerField(
        min_value=1,
        help_text="Identificador del negocio para generar sus estadísticas."
    )


# =============================================================================
# Serializador: AltaCajeroSerializer
# Descripción:
#   Permite registrar un nuevo cajero vinculado a un negocio existente.
# =============================================================================
class AltaCajeroSerializer(serializers.ModelSerializer):
    """Crea un cajero asociado al negocio del administrador autenticado."""
    contrasena = serializers.CharField(write_only=True)
    id_negocio = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Cajero
        fields = [
            "id_negocio", "correo", "telefono", "nombre",
            "apellido_paterno", "apellido_materno", "usuario", "contrasena"
        ]

    def create(self, validated_data):
        """Crea el usuario tipo cajero y lo vincula automáticamente al negocio."""
        User = get_user_model()

        if User.objects.filter(username=validated_data["correo"], tipo="cajero").exists():
            raise serializers.ValidationError({"correo": "Ya existe un usuario cajero con este correo."})

        User.objects.create_user(
            username=validated_data["correo"],
            password=validated_data["contrasena"],
            tipo="cajero"
        )

        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError({"id_negocio": "Usuario no autenticado."})

        username = User.objects.get(id=request.user.id).username
        administradorNegocio = AdministradorNegocio.objects.filter(
            Q(usuario=username) | Q(correo=username)
        ).first()

        if not administradorNegocio:
            raise serializers.ValidationError({"id_negocio": "Administrador no encontrado para el usuario."})

        validated_data["id_negocio"] = administradorNegocio.id_negocio
        return Cajero.objects.create(**validated_data)
