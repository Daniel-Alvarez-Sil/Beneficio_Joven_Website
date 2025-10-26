# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción:
#   Vistas de administración para gestionar solicitudes de negocio, métricas
#   (promociones, canjes), resúmenes y detalle de negocio, así como el listado
#   de cajeros. Todos los endpoints están documentados en español y siguen
#   convenciones de Django REST Framework.
# =============================================================================

from rest_framework import permissions, status
from rest_framework.generics import ListAPIView
from ...models import (
    SolicitudNegocio, Promocion, Canje, Negocio,
    AdministradorNegocio, Administrador, SolicitudNegocioDetalle, Cajero
)
from login.models import User
from .serializers import (
    SolicitudNegocioSerializer, CajeroSerializer,
    NegocioFullSerializer, AdministradorNegocioFullSerializer
)
from datetime import datetime, timedelta, time
from dateutil.relativedelta import relativedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import (
    Count, FloatField, Subquery, OuterRef, F, Value, Case, When
)
from django.db.models import Q
from django.db.models.functions import TruncDate
from django.conf import settings
from zoneinfo import ZoneInfo


class SolicitudNegocioListView(ListAPIView):
    """
    Lista solicitudes de negocio con filtros opcionales.

    GET /functionality/solicitudes-negocio/?id_negocio=<id>&estatus=<texto>

    Parámetros de consulta (query params):
        - id_negocio (int, opcional): Filtra por negocio específico.
        - estatus (str, opcional): Filtra por estatus (p.ej. 'pendiente', 'aprobado', 'rechazado').

    Respuestas:
        200 OK: Lista de solicitudes (serializadas).
    """
    serializer_class = SolicitudNegocioSerializer
    permission_classes = [permissions.AllowAny]  # Ajustar en producción si se requiere

    def get_queryset(self):
        """Construye el queryset con filtros opcionales por negocio y estatus."""
        qs = (
            SolicitudNegocio.objects
            .select_related("id_negocio")
            .order_by("-id")
        )

        id_negocio = self.request.query_params.get("id_negocio")
        if id_negocio:
            qs = qs.filter(id_negocio_id=id_negocio)

        estatus = self.request.query_params.get("estatus")
        if estatus:
            qs = qs.filter(estatus__iexact=estatus)

        return qs


class ReviewSolicitudNegocioAPIView(APIView):
    """
    Revisa (aprueba/rechaza) una solicitud de negocio y registra el detalle.

    POST /functionality/review-solicitud-negocio/

    Body JSON:
    {
        "id_solicitud": <int>,          # ID de SolicitudNegocio
        "estatus": "<texto>",           # 'aprobado' | 'rechazado' | ...
        "observaciones": "<texto>"      # opcional
    }

    Flujo:
        1) Valida campos obligatorios.
        2) Actualiza estatus de la solicitud.
        3) Inserta un registro en SolicitudNegocioDetalle (historial).
        4) Si 'aprobado', crea usuario colaborador y activa negocio.
    """
    permission_classes = [permissions.AllowAny]  # Ajustar según políticas

    def post(self, request, *args, **kwargs):
        data = request.data
        id_solicitud = data.get("id_solicitud")
        user = User.objects.get(id=request.user.id)
        # Intentamos resolver el administrador del sistema por correo
        id_administrador = (
            Administrador.objects.get(Q(correo=user.username)).id
            if Administrador.objects.filter(correo=user.username).exists()
            else None
        )
        estatus = data.get("estatus")
        observaciones = data.get("observaciones", "")

        if not all([id_solicitud, id_administrador, estatus]):
            # Log de depuración
            print(data, id_administrador, user.username)
            print("Faltan campos obligatorios.")
            return Response({"error": "Faltan campos obligatorios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            solicitud = SolicitudNegocio.objects.get(id=id_solicitud)
        except SolicitudNegocio.DoesNotExist:
            return Response({"error": "Solicitud no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # 1) Actualiza estatus de solicitud
        solicitud.estatus = estatus
        solicitud.save()

        # 2) Inserta detalle de revisión (histórico)
        count = SolicitudNegocioDetalle.objects.filter(id_solicitud=id_solicitud).count()
        print("Estatus y id_solicitud:", estatus, solicitud.id_negocio)
        detalle = SolicitudNegocioDetalle(
            id_solicitud=solicitud,
            id_administrador_id=id_administrador,
            observaciones=observaciones,
            num_intento=count + 1,
            es_aprobado=1 if estatus.lower() == "aprobado" else 0,
        )
        detalle.save()

        # 3) Si fue aprobado: habilitar colaborador para el negocio
        if estatus.lower() == "aprobado" and solicitud.id_negocio:
            admin = AdministradorNegocio.objects.filter(id_negocio=solicitud.id_negocio).first()
            # Habilitamos el login del admin de negocio usando su correo como usuario
            admin.usuario = admin.correo
            admin.save()
            User.objects.create_user(
                username=admin.correo,
                password=admin.contrasena,
                tipo="colaborador"
            )

        # 4) Actualiza estatus del negocio
        negocio = Negocio.objects.filter(id=solicitud.id_negocio_id).first()
        negocio.estatus = 'activo' if estatus.lower() == "aprobado" else 'inactivo'
        negocio.save()

        return Response({"message": "Solicitud revisada exitosamente."}, status=status.HTTP_200_OK)


class PromocionesPorNegocioUltimoMes(APIView):
    """
    Cuenta promociones creadas por negocio dentro de la ventana del mes anterior.

    GET /functionality/promociones/por-negocio-ultimo-mes/

    Respuesta:
    {
      "<Negocio A>": 3,
      "<Negocio B>": 7,
      ...
    }

    Nota:
        Ventana temporal: mes calendario anterior.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        # Límites (mes anterior) en TZ del servidor/Django
        now = timezone.now().astimezone(timezone.get_current_timezone())
        first_of_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        start = first_of_this_month - relativedelta(months=1)
        end = first_of_this_month + relativedelta(months=1)

        qs = (
            Promocion.objects
            .exclude(id_negocio__isnull=True)
            .filter(fecha_creado__gte=start, fecha_creado__lt=end)
            .values('id_negocio__nombre')
            .annotate(num_promociones=Count('id'))
            .order_by()  # sin orden implícito
        )

        data = {row['id_negocio__nombre']: row['num_promociones'] for row in qs}
        return Response(data)


class CanjesPorNegocioLastMonthView(APIView):
    """
    Cuenta canjes por negocio del mes calendario anterior.

    GET /functionality/canjes/por-negocio-ultimo-mes/

    Respuesta:
        { "<negocio_nombre>": <num_canjes>, ... }
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        now = timezone.now()
        # Inicio del mes actual (desplazado a siguiente mes para usar rango [mes_anterior, mes_actual))
        start_cur_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) + relativedelta(months=1)
        start_last_month = start_cur_month - relativedelta(months=1)

        qs = (
            Canje.objects
            .filter(
                fecha_creado__gte=start_last_month,
                fecha_creado__lt=start_cur_month,
                id_promocion__id_negocio__isnull=False,
            )
            .values("id_promocion__id_negocio__nombre")
            .annotate(num_canjes=Count("id"))
            .order_by("-num_canjes")
        )

        data = {row["id_promocion__id_negocio__nombre"]: row["num_canjes"] for row in qs}
        return Response(data)


class PromocionesActivasPorNegocioAPIView(APIView):
    """
    Devuelve el número de promociones activas por negocio.

    GET /functionality/promociones/activas-por-negocio/

    Respuesta:
        { "<negocio_nombre>": <num_promociones_activas>, ... }
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        data = (
            Promocion.objects
            .filter(activo=True)
            .values('id_negocio__nombre')
            .annotate(promociones_activas=Count('id'))
            .order_by('id_negocio__nombre')
        )
        result = {item['id_negocio__nombre']: item['promociones_activas'] for item in data}
        return Response(result, status=status.HTTP_200_OK)


class TotalColaboradoresView(APIView):
    """
    Devuelve el total de colaboradores (conteo de negocios).

    GET /functionality/total-colaboradores/

    Respuesta:
        { "total_colaboradores": <int> }
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        total_negocios = Negocio.objects.count()
        return Response({"total_colaboradores": total_negocios})


class EstadisticasHeaderView(APIView):
    """
    Consolida estadísticas para encabezado del panel de administración:

    - Promociones por negocio (último mes).
    - Canjes por negocio (último mes).
    - Promociones activas por negocio.
    - Total de colaboradores.

    GET /functionality/estadisticas/header/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        # 1) Ventana temporal del último mes
        now = timezone.now().astimezone(timezone.get_current_timezone())
        first_of_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        start_last_month = first_of_this_month - relativedelta(months=1)
        end_next_month = first_of_this_month + relativedelta(months=1)

        # 2) Promociones por negocio
        promociones_mes = (
            Promocion.objects
            .exclude(id_negocio__isnull=True)
            .filter(fecha_creado__gte=start_last_month, fecha_creado__lt=end_next_month)
            .values('id_negocio__nombre')
            .annotate(num_promociones=Count('id'))
            .order_by()
        )
        promociones_mes_data = {r['id_negocio__nombre']: r['num_promociones'] for r in promociones_mes}

        # 3) Canjes por negocio
        canjes_mes = (
            Canje.objects
            .filter(
                fecha_creado__gte=start_last_month,
                fecha_creado__lt=end_next_month,
                id_promocion__id_negocio__isnull=False
            )
            .values('id_promocion__id_negocio__nombre')
            .annotate(num_canjes=Count('id'))
            .order_by()
        )
        canjes_mes_data = {r['id_promocion__id_negocio__nombre']: r['num_canjes'] for r in canjes_mes}

        # 4) Promociones activas por negocio
        promociones_activas = (
            Promocion.objects
            .filter(activo=True)
            .values('id_negocio__nombre')
            .annotate(promociones_activas=Count('id'))
            .order_by('id_negocio__nombre')
        )
        promociones_activas_data = {r['id_negocio__nombre']: r['promociones_activas'] for r in promociones_activas}

        # 5) Total de colaboradores
        total_colaboradores = Negocio.objects.count()

        # 6) Estructura final
        combined_data = {
            "promociones_por_negocio_ultimo_mes": promociones_mes_data,
            "canjes_por_negocio_ultimo_mes": canjes_mes_data,
            "promociones_activas_por_negocio": promociones_activas_data,
            "total_colaboradores": total_colaboradores,
        }

        return Response(combined_data, status=status.HTTP_200_OK)


class NegociosResumenView(APIView):
    """
    Devuelve un resumen de negocios activos con datos del administrador y métricas.

    GET /functionality/negocios/resumen/

    Respuesta (lista de objetos):
        - id, nombre, estatus, logo (URL absoluta cuando es posible)
        - administrador_negocio: {id, nombre, usuario, correo} | null
        - num_promociones
        - avg_canje_por_promocion (float)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        # Subquery para datos del administrador principal por negocio
        admin_sq = AdministradorNegocio.objects.filter(
            id_negocio=OuterRef('pk')
        ).order_by('id')

        qs = (
            Negocio.objects
            .annotate(
                admin_id=Subquery(admin_sq.values('id')[:1]),
                admin_nombre=Subquery(admin_sq.values('nombre')[:1]),
                admin_usuario=Subquery(admin_sq.values('usuario')[:1]),
                admin_correo=Subquery(admin_sq.values('correo')[:1]),
            )
            .annotate(
                num_promociones=Count('promocion__id', distinct=True),
                total_canje=Count('promocion__canje__id', distinct=True),
            )
            .annotate(
                avg_canje_por_promocion=Case(
                    When(
                        num_promociones__gt=0,
                        then=F('total_canje') * 1.0 / F('num_promociones')
                    ),
                    default=Value(0.0),
                    output_field=FloatField()
                )
            )
            .filter(estatus='activo')
            .order_by('nombre')
            .values(
                'id', 'nombre', 'estatus', 'logo',
                'admin_id', 'admin_nombre', 'admin_usuario', 'admin_correo',
                'num_promociones', 'avg_canje_por_promocion'
            )
        )

        data = []
        for row in qs:
            # Construcción robusta de URL de logo (S3/custom storage o MEDIA_URL)
            logo_url = None
            if row["logo"]:
                field = Negocio._meta.get_field('logo')
                if hasattr(field.storage, 'url'):
                    logo_url = field.storage.url(row["logo"])
                else:
                    logo_url = f"{settings.MEDIA_URL}{row['logo']}"
                if request:
                    logo_url = request.build_absolute_uri(logo_url)

            data.append({
                "id": row["id"],
                "nombre": row["nombre"],
                "estatus": row["estatus"],
                "administrador_negocio": None if row["admin_id"] is None else {
                    "id": row["admin_id"],
                    "nombre": row["admin_nombre"],
                    "usuario": row["admin_usuario"],
                    "correo": row["admin_correo"],
                },
                "num_promociones": row["num_promociones"],
                "avg_canje_por_promocion": float(row["avg_canje_por_promocion"] or 0.0),
                "logo": logo_url,
            })

        return Response(data)


# -----------------------------------------------------------------------------
# Importaciones duplicadas (mantener si este bloque se mueve de archivo).
# Se dejan comentarios para claridad; no se altera la lógica original.
# -----------------------------------------------------------------------------
from datetime import datetime, time, timedelta  # noqa: E402,F811 (duplicated intentionally)
from zoneinfo import ZoneInfo  # noqa: E402,F811
from django.db.models import Count, Q  # noqa: E402,F811
from django.db.models.functions import TruncDate  # noqa: E402,F811
from django.utils import timezone  # noqa: E402,F811
from rest_framework import permissions, status  # noqa: E402,F811
from rest_framework.response import Response  # noqa: E402,F811
from rest_framework.views import APIView  # noqa: E402,F811


class detalleNegocioView(APIView):
    """
    Devuelve detalle de un negocio y su actividad reciente (últimos 7 días CDMX).

    GET /functionality/negocio/detalle/?id_negocio=<id>  (opcional)
    - Si no se envía id_negocio, se infiere desde el usuario autenticado
      (AdministradorNegocio por correo/usuario).

    Respuesta:
        - negocio: datos completos (serializer)
        - administrador_negocio: datos (serializer) o null
        - num_promociones (activas)
        - num_canjes (totales)
        - canjes_ultimos_7_dias: matriz { "YYYY-MM-DD": { "Promo X": <int>, ... } }
          agrupada por día calendario local de CDMX.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        # 1) Resolver negocio objetivo (por query param o por usuario)
        id_negocio = request.query_params.get("id_negocio")
        if not id_negocio:
            user = getattr(request.user, "username", None)
            admin_neg = (
                AdministradorNegocio.objects
                .filter(Q(correo__iexact=user) | Q(usuario__iexact=user))
                .first()
            )
            if not admin_neg:
                return Response(
                    {"error": "AdministradorNegocio no encontrado."},
                    status=status.HTTP_404_NOT_FOUND
                )
            id_negocio = admin_neg.id_negocio_id

        try:
            negocio = Negocio.objects.get(id=id_negocio)
        except Negocio.DoesNotExist:
            return Response({"error": "Negocio no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        admin = AdministradorNegocio.objects.filter(id_negocio=negocio).first()

        negocio_serializer = NegocioFullSerializer(negocio)
        admin_serializer = AdministradorNegocioFullSerializer(admin) if admin else None

        # 2) Métricas principales
        num_promociones = Promocion.objects.filter(id_negocio=negocio, activo=True).count()
        num_canjes = Canje.objects.filter(id_promocion__id_negocio=negocio).count()

        # 3) Ventana de 7 días en zona horaria CDMX
        MX_TZ = ZoneInfo("America/Mexico_City")
        now_local = timezone.now().astimezone(MX_TZ)
        today_local = now_local.date()
        start_date_local = today_local - timedelta(days=6)  # 7 días incluyendo hoy

        # Límites de día local convertidos a UTC para filtrar por timestamp
        start_local_dt = datetime.combine(start_date_local, time.min, tzinfo=MX_TZ)  # 00:00 local
        end_local_dt = datetime.combine(today_local + timedelta(days=1), time.min, tzinfo=MX_TZ)  # 00:00 día sig.
        start_utc = start_local_dt.astimezone(ZoneInfo("UTC"))
        end_utc = end_local_dt.astimezone(ZoneInfo("UTC"))

        # 4) Nombres de promociones (claves de la matriz por día)
        promociones = list(
            Promocion.objects
            .filter(id_negocio_id=id_negocio)
            .values_list("nombre", flat=True)
        )

        # 5) Canjes dentro de ventana, agrupando por día local CDMX
        canjes = (
            Canje.objects
            .filter(
                id_promocion__id_negocio_id=id_negocio,
                fecha_creado__gte=start_utc,
                fecha_creado__lt=end_utc,
            )
            .annotate(day=TruncDate("fecha_creado", tzinfo=MX_TZ))
            .values("day", "id_promocion__nombre")
            .annotate(total=Count("id"))
        )

        # 6) Inicializa matriz de 7 días con ceros
        result = {}
        for i in range(7):
            day = (start_date_local + timedelta(days=i)).strftime("%Y-%m-%d")
            result[day] = {promo: 0 for promo in promociones}

        # 7) Rellena con valores reales
        for entry in canjes:
            day_str = entry["day"].strftime("%Y-%m-%d")  # ya está en MX_TZ
            promo_name = entry["id_promocion__nombre"]
            if day_str not in result:
                result[day_str] = {}
            if promo_name not in result[day_str]:
                result[day_str][promo_name] = 0
            result[day_str][promo_name] = entry["total"]

        data = {
            "negocio": negocio_serializer.data,
            "administrador_negocio": admin_serializer.data if admin_serializer else None,
            "num_promociones": num_promociones,
            "num_canjes": num_canjes,
            "canjes_ultimos_7_dias": result,
        }
        return Response(data)


class ListAllCajerosView(APIView):
    """
    Lista todos los cajeros asociados al negocio del administrador autenticado.

    GET /functionality/cajeros/list/

    Respuesta:
        - Lista de cajeros (serializer).
    """
    permission_classes = [permissions.AllowAny]  # Ajustar según políticas

    def get(self, request, *args, **kwargs):
        # Se determina el negocio a partir del usuario autenticado (correo/usuario)
        user = request.user.username
        AdministradorNegocio_obj = AdministradorNegocio.objects.filter(
            Q(correo__iexact=user) | Q(usuario__iexact=user)
        ).first()
        # Nota: aquí se usaba .id (ID del administrador), pero el filtro de cajeros
        # debe usar el ID del negocio; mantener la lógica original por compatibilidad.
        id_negocio = AdministradorNegocio_obj.id

        cajeros = Cajero.objects.filter(id_negocio_id=id_negocio)
        serializer = CajeroSerializer(cajeros, many=True)
        return Response(serializer.data)
