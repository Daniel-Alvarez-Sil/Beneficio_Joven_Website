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

# Serializer to create promocion
from functionality.utils.colaboradores.serializers import PromocionCreateSerializer

def _slugify_filename(name: str) -> str:
    # drop extension & normalize
    base = os.path.splitext(name or "upload")[0]
    norm = unicodedata.normalize("NFKD", base).encode("ascii", "ignore").decode("ascii")
    safe = "".join(c for c in norm if c.isalnum() or c in (" ", "-", "_")).strip().replace(" ", "_")
    return safe or "upload"


def _guess_ext_and_mime(filename: str, fallback_mime: str) -> tuple[str, str]:
    mime = fallback_mime or "application/octet-stream"
    if not mime or mime == "application/octet-stream":
        mime = mimetypes.guess_type(filename or "", strict=False)[0] or mime
    # Prefer common image extensions
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


def _s3_https_url(bucket: str, region: str, key: str, custom_domain: Optional[str] = None) -> str:
    if custom_domain:
        return f"https://{custom_domain}/{key}"
    if region == "us-east-1":
        return f"https://{bucket}.s3.amazonaws.com/{key}"
    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"


class UploadFileView(APIView):
    """
    Receives ONLY a file via multipart/form-data (field name: 'file').
    Uploads it to S3 and returns:
      - imagen_key: S3 object key
      - imagen_url: public URL (works if bucket/object is publicly readable or via CloudFront custom domain)
      - imagen_presigned_url: temporary signed URL for private buckets (1 hour)
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        f = request.FILES.get("file")
        campos = request.data
        serializer = PromocionCreateSerializer(
            data=campos, 
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)   
        result = serializer.save()
        print("Serializer saved:", result)

        if not f:
            return Response(serializer.to_representation(result), status=status.HTTP_201_CREATED)

        # --- Config (from settings or environment) ---
        bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or os.environ.get("S3_BUCKET_NAME")
        region = (
            getattr(settings, "AWS_S3_REGION_NAME", None)
            or getattr(settings, "AWS_REGION", None)
            or os.environ.get("AWS_REGION")
            or "us-east-1"
        )
        custom_domain = getattr(settings, "AWS_S3_CUSTOM_DOMAIN", None) or os.environ.get("AWS_S3_CUSTOM_DOMAIN")
        prefix = getattr(settings, "S3_UPLOAD_PREFIX", "fotos_promociones/")  # folder like the Lambda used

        if not bucket:
            return Response(
                {"detail": "Missing bucket name (set AWS_STORAGE_BUCKET_NAME or S3_BUCKET_NAME)."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --- Build key like the Lambda did (sanitized name + timestamp/uuid + extension) ---
        safe_title = _slugify_filename(getattr(f, "name", "upload"))
        ext, mime = _guess_ext_and_mime(getattr(f, "name", ""), getattr(f, "content_type", None))
        ts = int(datetime.datetime.utcnow().timestamp())
        key = f"{prefix}{safe_title}_{ts}_{uuid.uuid4().hex}{ext}"

        # --- Upload (streaming) ---
        s3 = boto3.client("s3", region_name=region, aws_access_key_id=settings.AWS_ACCESS_KEY_ID, aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
        try:
            # upload_fileobj avoids loading the whole file into memory
            print("Uploading file to S3...")
            s3.put_object(
                Body=f,
                Bucket=bucket,
                Key=key,
                ContentType='image/jpeg',
            )
        except ClientError as e:
            return Response({"detail": "S3 upload failed", "error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        print("File uploaded successfully.")
        # --- URLs ---
        public_url = _s3_https_url(bucket, region, key, custom_domain=custom_domain)
        # Always include a presigned URL (works even if private)
        try:
            presigned_url = s3.generate_presigned_url(
                "get_object", Params={"Bucket": bucket, "Key": key}, ExpiresIn=10000
            )
        except ClientError:
            presigned_url = None
        
        # Fin, todo fue exitoso
        result.imagen = public_url
        result.save()
        return Response(serializer.to_representation(result), status=status.HTTP_201_CREATED)
        
