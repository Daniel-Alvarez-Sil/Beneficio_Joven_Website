from django.utils import timezone
from rest_framework import serializers
from django.db import transaction
from django.db.models import Sum, Count, Q

from .models import (
    Apartado, Cajero, Canje, Categoria, Negocio,
    Promocion, PromocionCategoria, Usuario, AdministradorNegocio
)

# ---------- Utilidades ----------
def now_mx():
    # Usa TZ del proyecto; si necesitas forzar 'America/Mexico_City', configúralo en settings.py
    return timezone.now()

# ---------- Serializers base ----------
class CajeroCreateSerializer(serializers.ModelSerializer):
    id_negocio = serializers.PrimaryKeyRelatedField(
        queryset=Negocio.objects.all()
    )

    class Meta:
        model = Cajero
        fields = [
            "id", "id_negocio", "correo", "telefono", "nombre",
            "apellido_paterno", "apellido_materno", "usuario", "contrasena"
        ]
        read_only_fields = ["id"]

class NegocioSolicitudSerializer(serializers.ModelSerializer):
    class Meta:
        model = Negocio
        fields = [
            "id", "correo", "telefono", "nombre", "rfc", "sitio_web",
            "cp", "numero_ext", "numero_int", "colonia", "municipio",
            "estado", "logo"
        ]
        read_only_fields = ["id"]

class PromocionCreateSerializer(serializers.ModelSerializer):
    # Entra una lista de IDs de categorías
    categoria_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Categoria.objects.all()),
        allow_empty=True,
        required=False
    )
    id_negocio = serializers.PrimaryKeyRelatedField(queryset=Negocio.objects.all())
    # Si prefieres deducir el administrador, no lo pidas en payload.
    id_administrador_negocio = serializers.PrimaryKeyRelatedField(
        queryset=AdministradorNegocio.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Promocion
        fields = [
            "id", "id_administrador_negocio", "id_negocio", "titulo", "descripcion",
            "limite_por_usuario", "limite_total", "inicio_promocion", "final_promocion",
            "imagen", "numero_canjeados", "tipo", "monto", "categoria_ids"
        ]
        read_only_fields = ["id", "numero_canjeados"]

    def validate(self, attrs):
        inicio = attrs.get("inicio_promocion")
        fin = attrs.get("final_promocion")
        if inicio and fin and fin <= inicio:
            raise serializers.ValidationError("final_promocion debe ser posterior a inicio_promocion.")
        return attrs

    def _resolve_admin(self, user_id: int, negocio: Negocio, admin: AdministradorNegocio | None):
        """
        Si no viene id_administrador_negocio, se intenta resolver por (id_usuario, id_negocio).
        """
        if admin:
            # valida que el admin pertenezca al negocio
            if getattr(admin, "id_negocio_id", None) != negocio.id:
                raise serializers.ValidationError("El administrador no pertenece a este negocio.")
            return admin
        # Autoresolución por usuario/negocio
        try:
            return AdministradorNegocio.objects.get(id_usuario_id=user_id, id_negocio_id=negocio.id)
        except AdministradorNegocio.DoesNotExist:
            raise serializers.ValidationError(
                "No se pudo resolver el administrador del negocio para este usuario."
            )

    @transaction.atomic
    def create(self, validated_data):
        categoria_ids = validated_data.pop("categoria_ids", [])
        negocio: Negocio = validated_data["id_negocio"]

        request = self.context.get("request")
        user_id = getattr(getattr(request, "user", None), "id", None) or request.headers.get("X-User-Id")
        if user_id is None:
            raise serializers.ValidationError("No se recibió CONTEXTO_GLOBAL ID_USUARIO.")

        # Validar que el negocio pertenezca al usuario
        if str(negocio.id_usuario_id) != str(user_id):
            raise serializers.ValidationError("No puedes crear promociones para un negocio que no es tuyo.")

        admin_in = validated_data.pop("id_administrador_negocio", None)
        admin = self._resolve_admin(user_id, negocio, admin_in)

        promocion = Promocion.objects.create(
            id_administrador_negocio=admin,
            **validated_data
        )

        # Relaciones promoción-categoría
        for cat in categoria_ids:
            PromocionCategoria.objects.get_or_create(
                id_promocion=promocion, id_categoria=cat
            )

        return promocion


class PromocionListSerializer(serializers.ModelSerializer):
    categorias = serializers.SerializerMethodField()
    estatus = serializers.SerializerMethodField()

    class Meta:
        model = Promocion
        fields = [
            "id", "id_negocio", "titulo", "descripcion",
            "inicio_promocion", "final_promocion", "numero_canjeados",
            "tipo", "monto", "estatus", "categorias"
        ]

    def get_categorias(self, obj: Promocion):
        q = PromocionCategoria.objects.filter(id_promocion=obj).select_related("id_categoria")
        return [{"id": pc.id_categoria_id, "titulo": pc.id_categoria.titulo} for pc in q]

    def get_estatus(self, obj: Promocion):
        now = now_mx()
        if obj.inicio_promocion and now < obj.inicio_promocion:
            return "PROGRAMADA"
        if obj.final_promocion and now > obj.final_promocion:
            return "FINALIZADA"
        return "ACTIVA"


# ---------- Estadísticas ----------
class EstadisticasResponseSerializer(serializers.Serializer):
    negocio_id = serializers.IntegerField()
    total_promociones = serializers.IntegerField()
    activas = serializers.IntegerField()
    futuras = serializers.IntegerField()
    expiradas = serializers.IntegerField()
    total_canjeados_campo = serializers.IntegerField()
    total_canje_registros = serializers.IntegerField()
    total_apartados = serializers.IntegerField()
    top_promociones_por_canjeados = serializers.ListField()
