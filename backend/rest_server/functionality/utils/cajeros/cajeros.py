from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ...models import CodigoQR, Promocion, AdministradorNegocio
from login.models import User
from django.utils import timezone


class validarQRView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        id_administrador_negocio = request.user.id 
        username = User.objects.get(id=id_administrador_negocio).username if id_administrador_negocio else None
        if not username:
            return Response({"detail": "Usuario no autenticado."}, status=status.HTTP_401_UNAUTHORIZED)
        administradorNegocio = AdministradorNegocio.objects.get(usuario=username) 
        if not administradorNegocio:
            return Response({"detail": "No se encontró el administrador de negocio."}, status=status.HTTP_404_NOT_FOUND)
        id_negocio = administradorNegocio.id_negocio if administradorNegocio else None
        if not id_negocio:
            return Response({"detail": "El administrador no tiene un negocio asociado."}, status=status.HTTP_404_NOT_FOUND)

        codigo = request.data.get('codigo')
        id_codigo = codigo.split('-')[1] if codigo else None
        print(f"Validando código QR: {id_codigo} para el negocio ID: {id_negocio}")

        try:
            codigo_qr = CodigoQR.objects.filter(id=id_codigo, utilizado=False).last()
            print(timezone.localtime(codigo_qr.fecha_creado + timezone.timedelta(minutes=5)))
            print(timezone.localtime(timezone.now()))
            if timezone.localtime(codigo_qr.fecha_creado + timezone.timedelta(minutes=5)) < timezone.localtime(timezone.now()):
                print("El código QR ha expirado")
                return Response({'success': False, 'message': 'El código QR ha expirado'}, status=403)
            promocion = Promocion.objects.get(id=codigo_qr.id_promocion.id, id_negocio_id=id_negocio)
            if not promocion:
                print("La promoción no pertenece a su negocio")
                return Response({'success': False, 'message': 'La promoción no pertenece a su negocio'}, status=403)
            codigo_qr.utilizado = True
            codigo_qr.save()
            print("Código QR validado correctamente")
            return Response({'success': True, 'id_canje': codigo_qr.id}, status=200)
        except CodigoQR.DoesNotExist:
            print("Código QR no válido")
            return Response({'success': False, 'message': 'Código QR no válido'}, status=404)