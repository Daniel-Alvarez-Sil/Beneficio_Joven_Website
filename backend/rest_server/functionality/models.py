# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción:
#   Este módulo define todos los modelos utilizados en el sistema de gestión
#   de negocios, promociones, usuarios, canjes y suscripciones.
#
#   Incluye entidades como Administradores, Negocios, Promociones, Usuarios,
#   Cajeros, Categorías y sus relaciones.
# =============================================================================

from django.db import models


# =============================================================================
# Modelo: Administrador
# Descripción:
#   Representa a los administradores del sistema central (no de negocio).
#   Gestionan solicitudes, revisión de negocios y configuración global.
# =============================================================================
class Administrador(models.Model):
    id = models.BigAutoField(primary_key=True)
    correo = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    nombre = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100, blank=True, null=True)
    apellido_materno = models.CharField(max_length=100, blank=True, null=True)
    contrasena = models.TextField()
    fecha_creado = models.DateTimeField()

    class Meta:
        db_table = 'administrador'

    def __str__(self):
        """Devuelve el nombre completo del administrador."""
        return f"{self.nombre} {self.apellido_paterno or ''} {self.apellido_materno or ''}".strip()


# =============================================================================
# Modelo: AdministradorNegocio
# Descripción:
#   Define a los administradores de cada negocio. Son responsables de
#   gestionar las promociones, cajeros y reportes de su empresa.
# =============================================================================
class AdministradorNegocio(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_negocio = models.ForeignKey('Negocio', models.DO_NOTHING, db_column='id_negocio', null=True, blank=True)
    correo = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    nombre = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100, blank=True, null=True)
    apellido_materno = models.CharField(max_length=100, blank=True, null=True)
    usuario = models.CharField(max_length=64)
    contrasena = models.TextField()

    class Meta:
        db_table = 'administrador_negocio'

    def __str__(self):
        """Devuelve el nombre completo del administrador de negocio."""
        return f"{self.nombre} ({self.correo})"


# =============================================================================
# Modelo: Apartado
# Descripción:
#   Representa promociones apartadas por los usuarios. Incluye estatus
#   de canje y fechas de vigencia.
# =============================================================================
class Apartado(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_promocion = models.ForeignKey('Promocion', models.DO_NOTHING, db_column='id_promocion')
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario')
    fecha_creado = models.DateTimeField()
    fecha_vigencia = models.DateTimeField(blank=True, null=True)
    estatus = models.CharField(
        choices=[("sin canjear", "Sin Canjear"), ("canjeado", "Canjeado")],
        max_length=20,
        blank=True,
        null=True
    )

    class Meta:
        db_table = 'apartado'

    def __str__(self):
        """Devuelve información sobre el apartado."""
        return f"Apartado de {self.id_usuario.nombre} - {self.id_promocion.nombre}"


# =============================================================================
# Modelo: Cajero
# Descripción:
#   Representa a los empleados encargados de validar los canjes de promociones
#   en el punto de venta del negocio.
# =============================================================================
class Cajero(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_negocio = models.ForeignKey('Negocio', models.DO_NOTHING, db_column='id_negocio')
    correo = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    nombre = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100, blank=True, null=True)
    apellido_materno = models.CharField(max_length=100, blank=True, null=True)
    usuario = models.CharField(max_length=64)
    contrasena = models.TextField()

    class Meta:
        db_table = 'cajero'

    def __str__(self):
        """Devuelve el nombre del cajero."""
        return f"{self.nombre} ({self.id_negocio.nombre})"


# =============================================================================
# Modelo: Canje
# Descripción:
#   Representa el registro de un canje exitoso de una promoción por parte
#   de un usuario, validado por un cajero.
# =============================================================================
class Canje(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_promocion = models.ForeignKey('Promocion', models.DO_NOTHING, db_column='id_promocion')
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario')
    id_cajero = models.ForeignKey(Cajero, models.DO_NOTHING, db_column='id_cajero')
    fecha_creado = models.DateTimeField()

    class Meta:
        db_table = 'canje'

    def __str__(self):
        """Devuelve una representación legible del canje."""
        return f"Canje de {self.id_usuario.nombre} en {self.id_promocion.nombre}"


# =============================================================================
# Modelo: Categoria
# Descripción:
#   Clasifica las promociones por tipo o categoría (e.g. comida, salud, moda).
# =============================================================================
class Categoria(models.Model):
    id = models.BigAutoField(primary_key=True)
    titulo = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True, null=True)
    image = models.ImageField(max_length=500, blank=True, null=True)

    class Meta:
        db_table = 'categoria'

    def __str__(self):
        """Devuelve el título de la categoría."""
        return self.titulo


# =============================================================================
# Modelo: Negocio
# Descripción:
#   Representa a las empresas registradas dentro del sistema.
#   Contiene información de contacto, dirección y estado de validación.
# =============================================================================
class Negocio(models.Model):
    id = models.BigAutoField(primary_key=True)
    correo = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    nombre = models.CharField(max_length=150)
    rfc = models.CharField(max_length=13, blank=True, null=True)
    sitio_web = models.TextField(blank=True, null=True)
    fecha_creado = models.DateTimeField()
    estatus = models.CharField(max_length=20, blank=True, null=True)
    cp = models.CharField(max_length=5, blank=True, null=True)
    numero_ext = models.CharField(max_length=10, blank=True, null=True)
    numero_int = models.CharField(max_length=10, blank=True, null=True)
    colonia = models.CharField(max_length=120, blank=True, null=True)
    municipio = models.CharField(max_length=120, blank=True, null=True)
    estado = models.CharField(max_length=120, blank=True, null=True)
    logo = models.ImageField(max_length=500, blank=True, null=True)
    url_maps = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'negocio'

    def __str__(self):
        """Devuelve el nombre del negocio."""
        return self.nombre


# =============================================================================
# Modelo: Promocion
# Descripción:
#   Define las promociones activas o pasadas ofrecidas por los negocios.
# =============================================================================
class Promocion(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_administrador_negocio = models.ForeignKey(
        AdministradorNegocio, models.DO_NOTHING,
        db_column='id_administrador_negocio', blank=True, null=True
    )
    id_negocio = models.ForeignKey(Negocio, models.DO_NOTHING, db_column='id_negocio', blank=True, null=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    limite_por_usuario = models.IntegerField(blank=True, null=True)
    limite_total = models.IntegerField(blank=True, null=True)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    imagen = models.ImageField(blank=True, null=True, max_length=500)
    numero_canjeados = models.IntegerField()
    tipo = models.CharField(
        choices=[
            ('precio', 'Precio'),
            ('porcentaje', 'Porcentaje'),
            ('2x1', '2x1'),
            ('trae un amigo', 'Trae un amigo'),
            ('otra', 'Otra')
        ],
        max_length=20
    )
    porcentaje = models.DecimalField(max_digits=12, decimal_places=2)
    precio = models.DecimalField(max_digits=12, decimal_places=5)
    activo = models.BooleanField(default=True)
    fecha_creado = models.DateTimeField(auto_now=True)
    categorias = models.ManyToManyField(
        Categoria,
        through='PromocionCategoria',
        related_name='promociones'
    )

    class Meta:
        db_table = 'promocion'

    def __str__(self):
        """Devuelve el nombre de la promoción."""
        return self.nombre


# =============================================================================
# Modelo: PromocionCategoria
# Descripción:
#   Tabla intermedia para la relación muchos-a-muchos entre Promocion y Categoria.
# =============================================================================
class PromocionCategoria(models.Model):
    id_promocion = models.ForeignKey(Promocion, models.DO_NOTHING, db_column='id_promocion')
    id_categoria = models.ForeignKey(Categoria, models.DO_NOTHING, db_column='id_categoria')

    class Meta:
        db_table = 'promocion_categoria'

    def __str__(self):
        """Relaciona promoción con su categoría."""
        return f"{self.id_promocion.nombre} - {self.id_categoria.titulo}"


# =============================================================================
# Modelo: SolicitudNegocio
# Descripción:
#   Almacena las solicitudes de registro o validación de nuevos negocios.
# =============================================================================
class SolicitudNegocio(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_negocio = models.ForeignKey(Negocio, models.DO_NOTHING, db_column='id_negocio', blank=True, null=True)
    estatus = models.CharField(
        max_length=20,
        choices=[
            ('pendiente', 'Pendiente'),
            ('aprobado', 'Aprobado'),
            ('rechazado', 'Rechazado')
        ],
        default='pendiente'
    )

    class Meta:
        db_table = 'solicitud_negocio'

    def __str__(self):
        """Devuelve el estado de la solicitud."""
        return f"Solicitud {self.id} - {self.estatus}"


# =============================================================================
# Modelo: SolicitudNegocioDetalle
# Descripción:
#   Registra el historial de revisiones de una solicitud de negocio.
# =============================================================================
class SolicitudNegocioDetalle(models.Model):
    id_solicitud = models.ForeignKey(SolicitudNegocio, models.DO_NOTHING, db_column='id_solicitud')
    fecha_creado = models.DateTimeField(auto_now_add=True)
    id_administrador = models.ForeignKey(Administrador, models.DO_NOTHING, db_column='id_administrador')
    es_aprobado = models.IntegerField()
    num_intento = models.IntegerField()
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'solicitud_negocio_detalle'

    def __str__(self):
        """Devuelve una descripción legible del intento de revisión."""
        return f"Revisión #{self.num_intento} - Solicitud {self.id_solicitud.id}"


# =============================================================================
# Modelo: Suscripcion
# Descripción:
#   Representa la suscripción de un usuario a un negocio, permitiendo
#   recibir notificaciones y acceder a promociones exclusivas.
# =============================================================================
class Suscripcion(models.Model):
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario')
    id_negocio = models.ForeignKey(Negocio, models.DO_NOTHING, db_column='id_negocio')
    fecha_creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'suscripcion'

    def __str__(self):
        """Devuelve la relación usuario-negocio."""
        return f"{self.id_usuario.nombre} suscrito a {self.id_negocio.nombre}"


# =============================================================================
# Modelo: Usuario
# Descripción:
#   Representa a los usuarios registrados dentro de la plataforma, con datos
#   personales, dirección, tipo y folio único de registro.
# =============================================================================
class Usuario(models.Model):
    id = models.BigAutoField(primary_key=True)
    correo = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    nombre = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100, blank=True, null=True)
    apellido_materno = models.CharField(max_length=100, blank=True, null=True)
    contrasena = models.TextField()
    curp = models.CharField(max_length=18, blank=True, null=True)
    nacimiento = models.DateField(blank=True, null=True)
    genero = models.CharField(max_length=20, blank=True, null=True)
    celular = models.CharField(max_length=20, blank=True, null=True)
    cp = models.CharField(max_length=5, blank=True, null=True)
    numero_ext = models.CharField(max_length=10, blank=True, null=True)
    numero_int = models.CharField(max_length=10, blank=True, null=True)
    colonia = models.CharField(max_length=120, blank=True, null=True)
    municipio = models.CharField(max_length=120, blank=True, null=True)
    estado = models.CharField(max_length=120, blank=True, null=True)
    fecha_creado = models.DateTimeField()
    folio = models.CharField(max_length=50)
    tipo = models.CharField(
        max_length=30,
        choices=[
            ('colaborador', 'Colaborador'),
            ('administrador', 'Administrador'),
            ('cajero', 'Cajero'),
            ('usuario', 'Usuario'),
        ],
        default='usuario'
    )

    class Meta:
        db_table = 'usuario'

    def __str__(self):
        """Devuelve el nombre completo del usuario."""
        return f"{self.nombre} ({self.correo})"


# =============================================================================
# Modelo: CodigoQR
# Descripción:
#   Almacena los códigos QR generados para cada usuario y promoción, con
#   control de uso (utilizado o no).
# =============================================================================
class CodigoQR(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_usuario = models.ForeignKey(Usuario, models.DO_NOTHING, db_column='id_usuario')
    id_promocion = models.ForeignKey(Promocion, models.DO_NOTHING, db_column='id_promocion')
    codigo = models.TextField()
    fecha_creado = models.DateTimeField(auto_now_add=True)
    utilizado = models.BooleanField(default=False)

    class Meta:
        db_table = 'codigo_qr'

    def __str__(self):
        """Devuelve una descripción del código QR."""
        return f"QR de {self.id_usuario.nombre} - {self.id_promocion.nombre}"
