from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from ...models import AdministradorNegocio, Negocio, SolicitudNegocio, Promocion, Cajero, PromocionCategoria
from login.models import User
from decimal import Decimal
# Optional, tuple and multipleobjectsreturned imports
from typing import Optional, Tuple
from django.core.exceptions import MultipleObjectsReturned
from functionality.utils.ai.automata import infer_promocion_fields


class NegocioCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Negocio
        # Excluimos campos calculados/FK que setearemos nosotros
        fields = [
            "correo", "telefono", "nombre", "rfc", "sitio_web",
            "estatus", "cp", "numero_ext", "numero_int", "colonia",
            "municipio", "estado", "logo"
        ]

class AdministradorNegocioInputSerializer(serializers.ModelSerializer):
    contrasena = serializers.CharField(write_only=True)

    class Meta:
        model = AdministradorNegocio
        # OJO: aquí NO pedimos id_negocio; lo seteamos tras crear el Negocio
        fields = [
            "correo", "telefono", "nombre", "apellido_paterno",
            "apellido_materno", "usuario", "contrasena"
        ]


class AltaNegocioYAdminSerializer(serializers.Serializer):
    negocio = NegocioCreateSerializer()
    administrador = AdministradorNegocioInputSerializer()

    def validate(self, attrs):
        User = get_user_model()
        username = attrs["administrador"]["usuario"]
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({
                "administrador": {"usuario": "Ya existe un usuario con ese nombre."}
            })
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        negocio_data = validated_data["negocio"]
        admin_data = validated_data["administrador"]

        # 1) Crear Negocio (fecha_creado e id_usuario se calculan aquí)
        negocio = Negocio.objects.create(
            **negocio_data,
            logo = self.context["logo_key"] if "logo_key" in self.context else None,
            fecha_creado=timezone.now(), 
        )

        # for cat_id in ai["categoria"]:
        #     Categoria.objects.create(
        #         id_negocio=negocio,
        #         id_categoria=cat_id
        #     )

        # 3) Crear AdministradorNegocio ligado al Negocio creado
        admin = AdministradorNegocio.objects.create(
            id_negocio=negocio,  # puedes pasar la instancia
            **admin_data
        )

        # 4) Crear solicitud de negocio pendiente
        solicitud = SolicitudNegocio.objects.create(
            id_negocio=negocio,
            estatus="PENDIENTE"
        )

        User.objects.create_user(
            username=admin_data["correo"],
            password=admin_data["contrasena"],
            tipo="administrador"
        )



        # Devolvemos los tres para serializar una respuesta útil
        return {"negocio": negocio, "administrador": admin}

    def to_representation(self, instance):
        negocio = instance["negocio"]
        admin = instance["administrador"]
        # solicitud = instance["solicitud"]
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
                "logo": self.context["logo_key"] if "logo_key" in self.context else None,
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


class PromocionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promocion
        fields = (
            "id", 
            "nombre",
            "descripcion",
            "fecha_inicio",
            "fecha_fin",
            "tipo",
            "porcentaje",
            "precio",
            "activo",
            "numero_canjeados",
            "imagen",
        )

class DeleteUpdatePromocionSerializer(serializers.Serializer):
    id_promocion = serializers.IntegerField(min_value=1)

class PromocionCreateSerializer(serializers.ModelSerializer):
    # ✅ Make optional. ("optional" isn't a DRF arg — use required=False + allow_null=True)
    id_negocio = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    id = serializers.IntegerField(read_only=True)
    imagen = serializers.ImageField(read_only=True)

    class Meta:
        model = Promocion
        fields = (
            "id",
            "id_negocio",
            "nombre",
            "descripcion",
            "fecha_inicio",
            "fecha_fin",
            "imagen", 
            "limite_por_usuario",
            "limite_total",
            "porcentaje",
            "precio",
            "activo",
        )

    def validate(self, attrs):
        print("Inicio de validación de PromocionCreateSerializer")
        fi = attrs.get("fecha_inicio")
        ff = attrs.get("fecha_fin")
        porcentaje = attrs.get("porcentaje", Decimal("0"))
        precio = attrs.get("precio", Decimal("0"))

        # Fechas
        if fi and ff and ff < fi:
            raise serializers.ValidationError({"fecha_fin": "Debe ser mayor o igual a fecha_inicio."})

        # Reglas de negocio
        if porcentaje is None:
            porcentaje = Decimal("0")
        if precio is None:
            precio = Decimal("0")

        if porcentaje <= 0 and precio <= 0:
            raise serializers.ValidationError("Debe especificar un porcentaje (> 0) o un precio (> 0).")

        if porcentaje < 0 or porcentaje > 100:
            raise serializers.ValidationError({"porcentaje": "Debe estar entre 0 y 100."})

        if precio < 0:
            raise serializers.ValidationError({"precio": "No puede ser negativo."})

        # Guardamos el tipo para usarlo en create()
        attrs["_tipo"] = "porcentaje" if porcentaje > 0 else "precio"
        print("Fin de validación de PromocionCreateSerializer")
        return attrs
    

    def _resolve_negocio_y_admin(self, id_negocio_pk: Optional[int]) -> Tuple[Negocio, AdministradorNegocio]:
        """
        1) Si viene id_negocio en el payload: valida y obtiene su primer AdministradorNegocio.
        2) Si NO viene: aplica la lógica solicitada para inferirlo desde el usuario autenticado.
        """
        if id_negocio_pk:
            try:
                negocio = Negocio.objects.get(pk=id_negocio_pk)
            except Negocio.DoesNotExist:
                raise serializers.ValidationError({"id_negocio": "Negocio no encontrado."})

            admin = (
                AdministradorNegocio.objects
                .filter(id_negocio=negocio)
                .order_by("id")
                .first()
            )
            if not admin:
                raise serializers.ValidationError(
                    "No existe AdministradorNegocio asociado a este id_negocio."
                )
            return negocio, admin

        # 🔐 Inferir desde el usuario autenticado
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            raise serializers.ValidationError({
                "id_negocio": "No se proporcionó id_negocio y no fue posible inferirlo (usuario no autenticado)."
            })

        id_administrador_negocio = request.user.id
        try:
            username = User.objects.get(id=id_administrador_negocio).username
        except User.DoesNotExist:
            raise serializers.ValidationError({"id_negocio": "Usuario autenticado inválido."})

        try:
            administradorNegocio = AdministradorNegocio.objects.get(usuario=username)
        except AdministradorNegocio.DoesNotExist:
            raise serializers.ValidationError({"id_negocio": "AdministradorNegocio no encontrado para el usuario."})
        except MultipleObjectsReturned:
            # Si existieran varios, tomamos el primero determinísticamente
            administradorNegocio = (
                AdministradorNegocio.objects.filter(usuario=username).order_by("id").first()
            )

        negocio = administradorNegocio.id_negocio  # puede ser instancia FK o id; manejamos ambos casos
        if isinstance(negocio, (int, str)):
            try:
                negocio = Negocio.objects.get(pk=negocio)
            except Negocio.DoesNotExist:
                raise serializers.ValidationError({"id_negocio": "Negocio no encontrado para el usuario."})

        return negocio, administradorNegocio

    def create(self, validated_data):
        from django.db import transaction

        print("Inicio de creación de Promoción")

        # Puede venir o no en el payload
        id_negocio_pk = validated_data.pop("id_negocio", None)

        # Resuelve Negocio e id_administrador_negocio según las reglas
        negocio, admin = self._resolve_negocio_y_admin(id_negocio_pk)

        # Tipo calculado en validate()
        tipo = validated_data.pop("_tipo")
        # Asegurar valor inicial
        validated_data.setdefault("numero_canjeados", 0)

        with transaction.atomic():
            promocion = Promocion.objects.create(
                id_negocio=negocio,
                id_administrador_negocio=admin,
                tipo=tipo,
                **validated_data,
            )
            ai = infer_promocion_fields(
                nombre=promocion.nombre,
                descripcion=promocion.descripcion,
            )
            print(f"Categorías AI inferidas: {ai}")
            for cat_id in ai:
                PromocionCategoria.objects.create(
                    id_promocion=promocion,
                    id_categoria_id=cat_id
                )
        return promocion

class EstadisticasParamsSerializer(serializers.Serializer):
    id_negocio = serializers.IntegerField(min_value=1)

class AltaCajeroSerializer(serializers.ModelSerializer):
    contrasena = serializers.CharField(write_only=True)
    id_negocio = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Cajero
        fields = [
            "id_negocio",
            "correo", "telefono", "nombre", "apellido_paterno",
            "apellido_materno", "usuario", "contrasena"
        ]

    def create(self, validated_data):
        print("Inicio de creación de Cajero")
        User = get_user_model()
        usuario_existente = User.objects.filter(username=validated_data["correo"], tipo="cajero").exists()
        if usuario_existente:
            raise serializers.ValidationError({"correo": "Ya existe un usuario cajero con este correo."})
        User.objects.create_user(
            username=validated_data["correo"],
            password=validated_data["contrasena"],
            tipo="cajero"
        )

        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            raise serializers.ValidationError({
                "id_negocio": "No se proporcionó id_negocio y no fue posible inferirlo (usuario no autenticado)."
            })

        id_administrador_negocio = request.user.id
        try:
            username = User.objects.get(id=id_administrador_negocio).username
        except User.DoesNotExist:
            raise serializers.ValidationError({"id_negocio": "Usuario autenticado inválido."})
        try:
            administradorNegocio = AdministradorNegocio.objects.get(usuario=username)
        except AdministradorNegocio.DoesNotExist:
            raise serializers.ValidationError({"id_negocio": "AdministradorNegocio no encontrado para el usuario."})
        except MultipleObjectsReturned:
            # Si existieran varios, tomamos el primero determinísticamente
            administradorNegocio = (
                AdministradorNegocio.objects.filter(usuario=username).order_by("id").first()
            )

        negocio = administradorNegocio.id_negocio  # puede ser instancia FK o id; manejamos ambos casos
        print(negocio)
        validated_data["id_negocio"] = negocio

        cajero = Cajero.objects.create(**validated_data)
        return cajero