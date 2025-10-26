# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción:
#   Serializadores relacionados con la gestión de negocios, cajeros y solicitudes.
#   Permiten representar los datos de modelos clave de manera estructurada
#   para su uso en las vistas y API REST.
# =============================================================================

from rest_framework import serializers
from ...models import SolicitudNegocio, Negocio, Cajero, AdministradorNegocio


# =============================================================================
# Clase: NegocioMiniSerializer
# Descripción:
#   Serializador con los campos mínimos del modelo Negocio.
#   Se utiliza principalmente para vistas anidadas o listados resumidos.
# =============================================================================
class NegocioMiniSerializer(serializers.ModelSerializer):
    """Serializa información básica de un negocio."""
    
    class Meta:
        model = Negocio
        fields = ("id", "nombre", "correo", "telefono", "estatus")


# =============================================================================
# Clase: CajeroSerializer
# Descripción:
#   Serializador completo del modelo Cajero.
#   Incluye todos los campos del modelo.
# =============================================================================
class CajeroSerializer(serializers.ModelSerializer):
    """Serializa todos los campos del modelo Cajero."""
    
    class Meta:
        model = Cajero
        fields = "__all__"


# =============================================================================
# Clase: SolicitudNegocioSerializer
# Descripción:
#   Serializador que representa una solicitud de negocio junto con la
#   información básica del negocio asociado (relación anidada).
# =============================================================================
class SolicitudNegocioSerializer(serializers.ModelSerializer):
    """
    Serializa las solicitudes de negocio, incluyendo datos anidados del negocio.

    Campos:
        - id: Identificador único de la solicitud.
        - estatus: Estado actual de la solicitud (pendiente, aprobada, rechazada).
        - id_negocio: Clave foránea al negocio asociado.
        - negocio: Información anidada (serializada) del negocio.
    """
    
    # Datos anidados de solo lectura sobre el negocio relacionado
    negocio = NegocioMiniSerializer(source="id_negocio", read_only=True)

    class Meta:
        model = SolicitudNegocio
        fields = ("id", "estatus", "id_negocio", "negocio")


# =============================================================================
# Clase: NegocioFullSerializer
# Descripción:
#   Serializador completo del modelo Negocio.
#   Se utiliza para vistas de detalle o administración.
# =============================================================================
class NegocioFullSerializer(serializers.ModelSerializer):
    """Serializa todos los campos del modelo Negocio."""
    
    class Meta:
        model = Negocio
        fields = "__all__"


# =============================================================================
# Clase: AdministradorNegocioFullSerializer
# Descripción:
#   Serializador completo del modelo AdministradorNegocio.
#   Permite representar o actualizar toda la información de los administradores.
# =============================================================================
class AdministradorNegocioFullSerializer(serializers.ModelSerializer):
    """Serializa todos los campos del modelo AdministradorNegocio."""
    
    class Meta:
        model = AdministradorNegocio
        fields = "__all__"
