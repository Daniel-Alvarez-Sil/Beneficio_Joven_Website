# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción:
#   Vista para la validación de códigos QR por parte de cajeros o
#   administradores de negocio autenticados.
#
#   El endpoint valida la vigencia del código QR, comprueba que la
#   promoción pertenece al negocio del cajero y registra el canje exitoso.
# =============================================================================

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ...models import CodigoQR, Promocion, AdministradorNegocio, Canje, Cajero
from login.models import User
from django.db.models import Q
from django.utils import timezone


# =============================================================================
# Clase: validarQRView
# Descripción:
#   Valida el código QR escaneado por un cajero para registrar un canje.
#
#   - Verifica autenticación del usuario.
#   - Comprueba que el QR no haya expirado (más de 5 minutos).
#   - Revisa que la promoción pertenezca al negocio del cajero.
#   - Marca el QR como utilizado y registra el canje en la base de datos.
# =============================================================================
class validarQRView(APIView):
    """Vista para validar códigos QR y registrar canjes."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        POST /functionality/cajero/validar-qr/

        Body:
            {
                "codigo": "PROMO-12345"
            }

        Respuestas:
            - 200: Canje registrado correctamente.
            - 403: Código expirado o no pertenece al negocio.
            - 404: Código no válido o negocio no encontrado.
            - 401: Usuario no autenticado.
        """
        # ==============================================================
        # 1️⃣ Obtener usuario autenticado y su negocio asociado
        # ==============================================================
        id_administrador_negocio = request.user.id
        username = User.objects.get(id=id_administrador_negocio).username if id_administrador_negocio else None

        if not username:
            return Response({"detail": "Usuario no autenticado."}, status=status.HTTP_401_UNAUTHORIZED)

        # Determinar si es administrador o cajero
        try:
            canjeador = AdministradorNegocio.objects.get(Q(usuario=username) | Q(correo=username))
        except AdministradorNegocio.DoesNotExist:
            canjeador = Cajero.objects.filter(Q(usuario=username) | Q(correo=username)).first()

        if not canjeador:
            return Response({"detail": "No se encontró el cajero o administrador de negocio."},
                            status=status.HTTP_404_NOT_FOUND)

        id_negocio = getattr(canjeador, "id_negocio", None)
        if not id_negocio:
            return Response({"detail": "El usuario no tiene un negocio asociado."},
                            status=status.HTTP_404_NOT_FOUND)

        # ==============================================================
        # 2️⃣ Procesar código QR recibido
        # ==============================================================
        codigo = request.data.get("codigo")
        id_codigo = codigo.split('-')[1] if codigo else None
        print(f"Validando código QR: {id_codigo} para el negocio ID: {id_negocio}")

        if not id_codigo:
            return Response({'success': False, 'message': 'Código QR inválido o ausente.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # ==============================================================
        # 3️⃣ Validar existencia y vigencia del QR
        # ==============================================================
        try:
            codigo_qr = CodigoQR.objects.filter(id=id_codigo, utilizado=False).last()
            if not codigo_qr:
                print("Código QR no encontrado o ya utilizado")
                return Response({'success': False, 'message': 'Código QR no válido o ya utilizado'}, status=404)

            # Validar tiempo de vigencia (5 minutos)
            fecha_expiracion = timezone.localtime(codigo_qr.fecha_creado + timezone.timedelta(minutes=5))
            ahora = timezone.localtime(timezone.now())
            print(f"Fecha expiración: {fecha_expiracion}, Hora actual: {ahora}")

            if fecha_expiracion < ahora:
                print("El código QR ha expirado")
                return Response({'success': False, 'message': 'El código QR ha expirado'}, status=403)

        except CodigoQR.DoesNotExist:
            print("Código QR no existe")
            return Response({'success': False, 'message': 'Código QR no válido'}, status=404)

        # ==============================================================
        # 4️⃣ Verificar que la promoción pertenece al negocio correcto
        # ==============================================================
        try:
            promocion = Promocion.objects.get(id=codigo_qr.id_promocion.id, id_negocio_id=id_negocio)
        except Promocion.DoesNotExist:
            print("La promoción no pertenece a este negocio")
            return Response({'success': False, 'message': 'La promoción no pertenece a su negocio'}, status=403)

        # ==============================================================
        # 5️⃣ Registrar el canje y actualizar estado
        # ==============================================================
        codigo_qr.utilizado = True
        codigo_qr.save()

        promocion.numero_canjeados += 1
        promocion.save()

        # Crear el registro del canje
        Canje.objects.create(
            id_promocion=promocion,
            id_usuario=codigo_qr.id_usuario,
            id_cajero_id=canjeador.id,
            fecha_creado=timezone.now()
        )

        print("Código QR validado correctamente")
        return Response({'success': True, 'message': 'Código validado correctamente.'}, status=200)
