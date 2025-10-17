from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from ..models import CodigoQR
from django.utils import timezone

class CodigoQRView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        id_usuario = request.data.get('id_usuario')
        id_promocion = request.data.get('id_promocion')
        codigo_qr = CodigoQR.objects.create(
            id_usuario_id=id_usuario,
            codigo=f"QR-{id_usuario}-{id_promocion}",
            fecha_creado=timezone.now()
        )
        return Response({'id_canje': codigo_qr.id, 'message': codigo_qr.codigo}, status=201)
