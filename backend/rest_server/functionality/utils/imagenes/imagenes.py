# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción:
#   Este módulo implementa vistas y utilidades para la carga (upload) de archivos
#   a Amazon S3, permitiendo asociarlos con modelos de Promoción y Negocio.
#   También incluye funciones auxiliares para la generación de nombres de archivo
#   seguros, detección de MIME types y generación de URLs públicas.
# =============================================================================

import os
import uuid
import datetime
import mimetypes
import unicodedata
from typing import Optional

import boto3
from botocore.exceptions import ClientError

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

# Serializadores para creación de promociones y negocios
from functionality.utils.colaboradores.serializers import (
    PromocionCreateSerializer,
    AltaNegocioYAdminSerializer,
)


# =============================================================================
# Función: _slugify_filename
# Descripción:
#   Limpia y normaliza el nombre de un archivo, eliminando caracteres especiales
#   y convirtiéndolo a una forma segura para su almacenamiento en S3.
# =============================================================================
def _slugify_filename(name: str) -> str:
    """Convierte el nombre del archivo a un formato seguro y compatible con S3."""
    base = os.path.splitext(name or "upload")[0]
    norm = unicodedata.normalize("NFKD", base).encode("ascii", "ignore").decode("ascii")
    safe = "".join(c for c in norm if c.isalnum() or c in (" ", "-", "_")).strip().replace(" ", "_")
    return safe or "upload"


# =============================================================================
# Función: _guess_ext_and_mime
# Descripción:
#   Detecta la extensión y el tipo MIME del archivo cargado.
# =============================================================================
def _guess_ext_and_mime(filename: str, fallback_mime: str) -> tuple[str, str]:
    """Devuelve una tupla con (extensión, tipo MIME) del archivo."""
    mime = fallback_mime or "application/octet-stream"
    if not mime or mime == "application/octet-stream":
        mime = mimetypes.guess_type(filename or "", strict=False)[0] or mime

    # Tabla de extensiones preferidas para imágenes comunes
    table = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/svg+xml": ".svg",
        "image/heic": ".heic",
    }
    ext = table.get(mime) or os.path.splitext(filename or "")[1] or ".bin"
    return ext, mime


# =============================================================================
# Función: _s3_https_url
# Descripción:
#   Genera una URL pública HTTPS para acceder a un archivo almacenado en S3.
# =============================================================================
def _s3_https_url(bucket: str, region: str, key: str, custom_domain: Optional[str] = None) -> str:
    """Devuelve la URL HTTPS del objeto almacenado en S3."""
    if custom_domain:
        return f"https://{custom_domain}/{key}"
    if region == "us-east-1":
        return f"https://{bucket}.s3.amazonaws.com/{key}"
    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"


# =============================================================================
# Función: upload_file_to_s3
# Descripción:
#   Carga un archivo al bucket configurado en AWS S3 y devuelve la clave (key)
#   del objeto creado. En caso de error, devuelve una respuesta con el detalle.
# =============================================================================
def upload_file_to_s3(f, prefix) -> str:
    """
    Sube un archivo al bucket S3 configurado en settings.

    Parámetros:
        f (File): Archivo recibido por multipart/form-data.
        prefix (str): Carpeta o prefijo en el bucket (ej. 'fotos_promociones/').

    Retorna:
        str: Clave (key) generada del archivo dentro del bucket.
    """
    bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or os.environ.get("S3_BUCKET_NAME")
    region = (
        getattr(settings, "AWS_S3_REGION_NAME", None)
        or getattr(settings, "AWS_REGION", None)
        or os.environ.get("AWS_REGION")
        or "us-east-1"
    )
    custom_domain = getattr(settings, "AWS_S3_CUSTOM_DOMAIN", None) or os.environ.get("AWS_S3_CUSTOM_DOMAIN")

    if not bucket:
        return Response(
            {"detail": "Falta el nombre del bucket (defina AWS_STORAGE_BUCKET_NAME o S3_BUCKET_NAME)."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Generar nombre seguro del archivo
    safe_title = _slugify_filename(getattr(f, "name", "upload"))
    ext, mime = _guess_ext_and_mime(getattr(f, "name", ""), getattr(f, "content_type", None))
    ts = int(datetime.datetime.utcnow().timestamp())
    key = f"{prefix}{safe_title}_{ts}_{uuid.uuid4().hex}{ext}"

    # Carga directa a S3
    s3 = boto3.client(
        "s3",
        region_name=region,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    try:
        print("Subiendo archivo a S3...")
        s3.put_object(Body=f, Bucket=bucket, Key=key, ContentType=mime)
    except ClientError as e:
        return Response({"detail": "Error al subir a S3", "error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

    print("Archivo subido correctamente.")
    return key


# =============================================================================
# Clase: UploadPromocionWithFileView
# Descripción:
#   API que permite crear una nueva promoción y subir su imagen a S3.
#   Recibe datos y archivo mediante multipart/form-data.
# =============================================================================
class UploadPromocionWithFileView(APIView):
    """
    Vista para subir una imagen y crear una promoción.

    Recibe:
      - Campos de la promoción (POST data)
      - Archivo (campo 'file')

    Devuelve:
      - Datos de la promoción creada
      - Clave y URL de la imagen (si aplica)
    """

    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        """Crea una promoción y sube la imagen a AWS S3 si se incluye."""
        f = request.FILES.get("file")
        campos = request.data

        serializer = PromocionCreateSerializer(data=campos, context={"request": request})
        serializer.is_valid(raise_exception=True)
        result = serializer.save()

        print("Promoción creada correctamente:", result)

        # Si no se adjuntó archivo, se devuelve solo el registro creado
        if not f:
            return Response(serializer.to_representation(result), status=status.HTTP_201_CREATED)

        # Cargar imagen a S3 y actualizar el campo 'imagen'
        key = upload_file_to_s3(f, 'fotos_promociones/')
        print("Archivo cargado a S3 con key:", key)

        result.imagen = key
        result.save()

        print("Promoción actualizada con imagen.")
        return Response(serializer.to_representation(result), status=status.HTTP_201_CREATED)


# =============================================================================
# Clase: UploadNegocioWithFileView
# Descripción:
#   API que permite registrar un negocio junto con su logo subido a AWS S3.
# =============================================================================
class UploadNegocioWithFileView(APIView):
    """
    Vista para crear un negocio y subir su logotipo a AWS S3.

    Recibe:
      - Campos del negocio (POST data)
      - Archivo de logo (campo 'file')

    Devuelve:
      - Datos del negocio registrado
      - Clave del logo en S3
    """

    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        """Crea un negocio y sube su logotipo a S3 (si fue enviado)."""
        f = request.FILES.get("file")
        key = None

        if f:
            key = upload_file_to_s3(f, 'logos_negocios/')
            print("Logo subido correctamente a S3 con key:", key)

        serializer = AltaNegocioYAdminSerializer(
            data=request.data,
            context={"request": request, "logo_key": key if f else None}
        )

        serializer.is_valid(raise_exception=True)
        result = serializer.save()

        print("Negocio y administrador creados exitosamente.")
        return Response(serializer.to_representation(result), status=status.HTTP_201_CREATED)
