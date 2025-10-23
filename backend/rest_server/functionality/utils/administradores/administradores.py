from rest_framework import permissions, status
from rest_framework.generics import ListAPIView
from ...models import SolicitudNegocio, Promocion, Canje, Negocio, AdministradorNegocio, Administrador, SolicitudNegocioDetalle, Cajero
from login.models import User
from .serializers import SolicitudNegocioSerializer, CajeroSerializer, NegocioFullSerializer, AdministradorNegocioFullSerializer
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
    GET /functionality/solicitudes-negocio/?id_negocio=<id>&estatus=<texto>
    """
    serializer_class = SolicitudNegocioSerializer
    permission_classes = [permissions.AllowAny]  # adjust if you want it public

    def get_queryset(self):
        qs = (SolicitudNegocio.objects
              .select_related("id_negocio")
              .order_by("-id"))

        id_negocio = self.request.query_params.get("id_negocio")
        if id_negocio:
            qs = qs.filter(id_negocio_id=id_negocio)

        estatus = self.request.query_params.get("estatus")
        if estatus:
            qs = qs.filter(estatus__iexact=estatus)

        return qs

class ReviewSolicitudNegocioAPIView(APIView):
    permission_classes = [permissions.AllowAny]  # adjust as needed

    def post(self, request, *args, **kwargs):
        """
        POST /functionality/review-solicitud-negocio/
        Body:
        {
            "id_solicitud": <int>,
            "estatus": "<texto>",
            "observaciones": "<texto>"
        }
        """
        data = request.data
        id_solicitud = data.get("id_solicitud")
        user = User.objects.get(id=request.user.id)
        id_administrador = Administrador.objects.get(Q(correo=user.username)).id if Administrador.objects.filter(correo=user.username).exists() else None
        estatus = data.get("estatus")
        observaciones = data.get("observaciones", "")

        if not all([id_solicitud, id_administrador, estatus]):
            print(data, id_administrador, user.username)
            print("Faltan campos obligatorios.")
            return Response({"error": "Faltan campos obligatorios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            solicitud = SolicitudNegocio.objects.get(id=id_solicitud)
        except SolicitudNegocio.DoesNotExist:
            return Response({"error": "Solicitud no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # Update solicitud status
        solicitud.estatus = estatus
        solicitud.save()
        count = SolicitudNegocioDetalle.objects.filter(id_solicitud=id_solicitud).count()
        print("Estatus y id_solicitud:", estatus, solicitud.id_negocio)
        # Create SolicitudNegocioDetalle entry
        detalle = SolicitudNegocioDetalle(
            id_solicitud=solicitud,
            id_administrador_id=id_administrador,
            observaciones=observaciones,
            num_intento=count + 1,
            es_aprobado=1 if estatus.lower() == "aprobado" else 0,
        )
        detalle.save()

        # Creamos usuario de colaborador
        if estatus.lower() == "aprobado" and solicitud.id_negocio:
            admin = AdministradorNegocio.objects.filter(id_negocio=solicitud.id_negocio).first()
            admin.usuario = admin.correo
            admin.save()
            User.objects.create_user(
                username=admin.correo,
                password=admin.contrasena,
                tipo="colaborador"
            )

        negocio = Negocio.objects.filter(id=solicitud.id_negocio_id).first()
        negocio.estatus = 'activo' if estatus.lower() == "aprobado" else 'inactivo'
        negocio.save()

        return Response({"message": "Solicitud revisada exitosamente."}, status=status.HTTP_200_OK)

class PromocionesPorNegocioUltimoMes(APIView):
    permission_classes = [permissions.AllowAny]
    """
    Returns:
    {
      "Negocio A": 3,
      "Negocio B": 7,
      ...
    }
    Time window: previous *calendar* month [start, end)
    """
    def get(self, request, *args, **kwargs):
        # Boundaries for previous calendar month in server TZ
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
            .order_by()  # no implicit ordering for speed
        )

        data = {row['id_negocio__nombre']: row['num_promociones'] for row in qs}
        return Response(data)

class CanjesPorNegocioLastMonthView(APIView):
    """
    GET -> returns: { "<negocio_nombre>": <num_canjes>, ... }
    Period: previous *calendar* month in Django/server TZ.
    """
    permission_classes = [permissions.AllowAny]  # or [] if you want it public

    def get(self, request, *args, **kwargs):
        now = timezone.now()
        # Start of the current month
        start_cur_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) + relativedelta(months=1)
        # Start of the previous month
        if start_cur_month.month == 1:
            start_last_month = start_cur_month.replace(year=start_cur_month.year - 1, month=12)
        else:
            start_last_month = start_cur_month.replace(month=start_cur_month.month - 1)

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
    permission_classes = [permissions.AllowAny]  # or [] if you want it public
    def get(self, request):
        # Aggregate count of active promotions grouped by negocio
        data = (
            Promocion.objects
            .filter(activo=True)
            .values('id_negocio__nombre')
            .annotate(promociones_activas=Count('id'))
            .order_by('id_negocio__nombre')
        )

        # Transform into desired format
        result = {
            item['id_negocio__nombre']: item['promociones_activas'] for item in data
        }

        return Response(result, status=status.HTTP_200_OK)


class TotalColaboradoresView(APIView):
    permission_classes = [permissions.AllowAny]  # or [] if you want it public

    def get(self, request, *args, **kwargs):

        total_negocios = Negocio.objects.count()

        return Response({"total_colaboradores": total_negocios})


class EstadisticasHeaderView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        # ==== 1️⃣ Promociones por negocio del último mes ====
        now = timezone.now().astimezone(timezone.get_current_timezone())
        first_of_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        start_last_month = first_of_this_month - relativedelta(months=1)
        end_next_month = first_of_this_month + relativedelta(months=1)

        promociones_mes = (
            Promocion.objects
            .exclude(id_negocio__isnull=True)
            .filter(fecha_creado__gte=start_last_month, fecha_creado__lt=end_next_month)
            .values('id_negocio__nombre')
            .annotate(num_promociones=Count('id'))
            .order_by()
        )
        promociones_mes_data = {r['id_negocio__nombre']: r['num_promociones'] for r in promociones_mes}

        # ==== 2️⃣ Canjes por negocio del último mes ====

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

        # ==== 3️⃣ Promociones activas por negocio ====
        promociones_activas = (
            Promocion.objects
            .filter(activo=True)
            .values('id_negocio__nombre')
            .annotate(promociones_activas=Count('id'))
            .order_by('id_negocio__nombre')
        )
        promociones_activas_data = {r['id_negocio__nombre']: r['promociones_activas'] for r in promociones_activas}

        # ==== 4️⃣ Total de colaboradores ====
        total_colaboradores = Negocio.objects.count()

        # ==== 🧩 Combine all data ====
        combined_data = {
            "promociones_por_negocio_ultimo_mes": promociones_mes_data,
            "canjes_por_negocio_ultimo_mes": canjes_mes_data,
            "promociones_activas_por_negocio": promociones_activas_data,
            "total_colaboradores": total_colaboradores,
        }

        return Response(combined_data, status=status.HTTP_200_OK)

class NegociosResumenView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
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
            ).filter(estatus='activo')
            .order_by('nombre')
            .values(
                'id', 'nombre', 'estatus', 'logo',
                'admin_id', 'admin_nombre', 'admin_usuario', 'admin_correo',
                'num_promociones', 'avg_canje_por_promocion'
            )
        )

        data = []
        for row in qs:
            # ✅ get logo URL properly
            logo_url = None
            if row["logo"]:
                # Case 1: absolute path (S3 or custom storage)
                if hasattr(Negocio._meta.get_field('logo').storage, 'url'):
                    logo_url = Negocio._meta.get_field('logo').storage.url(row["logo"])
                # Case 2: fallback to MEDIA_URL (local)
                else:
                    logo_url = f"{settings.MEDIA_URL}{row['logo']}"

                # Build full URL (optional, if you want the domain too)
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

from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

class detalleNegocioView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        id_negocio = request.query_params.get("id_negocio")
        if not id_negocio:
            user = getattr(request.user, "username", None)
            admin_neg = (
                AdministradorNegocio.objects
                .filter(Q(correo__iexact=user) | Q(usuario__iexact=user))
                .first()
            )
            if not admin_neg:
                return Response({"error": "AdministradorNegocio no encontrado."},
                                status=status.HTTP_404_NOT_FOUND)
            id_negocio = admin_neg.id_negocio_id

        try:
            negocio = Negocio.objects.get(id=id_negocio)
        except Negocio.DoesNotExist:
            return Response({"error": "Negocio no encontrado."},
                            status=status.HTTP_404_NOT_FOUND)

        admin = AdministradorNegocio.objects.filter(id_negocio=negocio).first()

        negocio_serializer = NegocioFullSerializer(negocio)
        admin_serializer = AdministradorNegocioFullSerializer(admin) if admin else None

        num_promociones = Promocion.objects.filter(id_negocio=negocio, activo=True).count()
        num_canjes = Canje.objects.filter(id_promocion__id_negocio=negocio).count()

        # ---- Correct time handling (CDMX local days) ----
        MX_TZ = ZoneInfo("America/Mexico_City")

        # Current local date in CDMX
        now_local = timezone.now().astimezone(MX_TZ)
        today_local = now_local.date()
        start_date_local = today_local - timedelta(days=6)  # last 7 days including today

        # Convert local day bounds to UTC for filtering
        start_local_dt = datetime.combine(start_date_local, time.min, tzinfo=MX_TZ)   # 00:00 local
        end_local_dt   = datetime.combine(today_local + timedelta(days=1), time.min, tzinfo=MX_TZ)  # next 00:00 local
        start_utc = start_local_dt.astimezone(ZoneInfo("UTC"))
        end_utc   = end_local_dt.astimezone(ZoneInfo("UTC"))

        # All promociones (names) for matrix keys
        promociones = list(
            Promocion.objects
            .filter(id_negocio_id=id_negocio)
            .values_list("nombre", flat=True)
        )

        # Filter by UTC window, group by LOCAL (CDMX) calendar day
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

        # Initialize all 7 local days to zero
        result = {}
        for i in range(7):
            day = (start_date_local + timedelta(days=i)).strftime("%Y-%m-%d")
            result[day] = {promo: 0 for promo in promociones}

        # Fill actual totals
        for entry in canjes:
            day_str = entry["day"].strftime("%Y-%m-%d")  # already in MX_TZ thanks to tzinfo
            promo_name = entry["id_promocion__nombre"]
            # Guard if promo renamed/deleted
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
    permission_classes = [permissions.AllowAny]  # adjust as needed
    def get(self, request, *args, **kwargs):
        user = request.user.username
        AdministradorNegocio_obj = AdministradorNegocio.objects.filter(Q(correo__iexact=user) | Q(usuario__iexact=user)).first()
        id_negocio = AdministradorNegocio_obj.id

        cajeros = Cajero.objects.filter(id_negocio_id=id_negocio)
        serializer = CajeroSerializer(cajeros, many=True)
        return Response(serializer.data)