from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from .models import AdministradorNegocio, Negocio, SolicitudNegocio # ajusta import

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
            fecha_creado=timezone.now()
        )


        # 3) Crear AdministradorNegocio ligado al Negocio creado
        admin = AdministradorNegocio.objects.create(
            id_negocio=negocio,  # puedes pasar la instancia
            **admin_data
        )

        # 4) Crear solicitud de negocio pendiente
        # solicitud = SolicitudNegocio.objects.create(
        #     id_negocio=negocio,
        #     estatus="PENDIENTE"
        # )

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
                "logo": negocio.logo,
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
            # "solicitud": {
            #     "id": solicitud.id,
            #     "id_negocio": negocio.id,
            #     "estatus": solicitud.estatus,
            # }
        }


from rest_framework import serializers
from .models import Promocion

class PromocionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promocion
        fields = (
            "titulo",
            "descripcion",
            "inicio_promocion",
            "final_promocion",
            "tipo",
            "monto",
            "estatus",
            "numero_canjeados",
        )
