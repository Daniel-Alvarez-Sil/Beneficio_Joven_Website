from django.db import models

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
        # managed = False
        db_table = 'administrador'


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
        # managed = False
        db_table = 'administrador_negocio'


class Apartado(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_promocion = models.ForeignKey('Promocion', models.DO_NOTHING, db_column='id_promocion')
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario')
    fecha_creado = models.DateTimeField()
    fecha_vigencia = models.DateTimeField(blank=True, null=True)
    estatus = models.CharField(choices=[("sin canjear", "Sin Canjear"), ("canjeado", "Canjeado")], blank=True, null=True)
    # url = models.TextField(blank=True, null=True)

    class Meta:
        # managed = False
        db_table = 'apartado'

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
        # managed = False
        db_table = 'cajero'




class Canje(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_promocion = models.ForeignKey('Promocion', models.DO_NOTHING, db_column='id_promocion')
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario')
    id_cajero = models.ForeignKey(Cajero, models.DO_NOTHING, db_column='id_cajero')
    fecha_creado = models.DateTimeField()

    class Meta:
        # managed = False
        db_table = 'canje'


class Categoria(models.Model):
    id = models.BigAutoField(primary_key=True)
    titulo = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True, null=True)
    image = models.ImageField(max_length=500, blank=True, null=True)

    class Meta:
        # managed = False
        db_table = 'categoria'


class Negocio(models.Model):
    id = models.BigAutoField(primary_key=True)
    # id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario')
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
        # managed = False
        db_table = 'negocio'


class Promocion(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_administrador_negocio = models.ForeignKey(AdministradorNegocio, models.DO_NOTHING, db_column='id_administrador_negocio', blank=True, null=True)
    id_negocio = models.ForeignKey(Negocio, models.DO_NOTHING, db_column='id_negocio', blank=True, null=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    limite_por_usuario = models.IntegerField(blank=True, null=True)
    limite_total = models.IntegerField(blank=True, null=True)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    imagen = models.ImageField(blank=True, null=True, max_length=500)
    numero_canjeados = models.IntegerField()
    tipo = models.CharField(choices=[('precio', 'Precio'), ('porcentaje', 'Porcentaje'), ('2x1', '2x1'), ('trae un amigo', 'Trae un amigo'), ('otra', 'Otra')], max_length=20)
    porcentaje = models.DecimalField(max_digits=12, decimal_places=2)
    precio = models.DecimalField(max_digits=12, decimal_places=5)
    # Estatus opciones "activado, desactivado"
    activo = models.BooleanField(default=True)
    fecha_creado = models.DateTimeField(auto_now=True)
    categorias = models.ManyToManyField(
        Categoria,
        through='PromocionCategoria',
        related_name='promociones'
    )

    class Meta:
        # managed = False
        db_table = 'promocion'


class PromocionCategoria(models.Model):
    pk = models.CompositePrimaryKey('id_promocion', 'id_categoria')
    id_promocion = models.ForeignKey(Promocion, models.DO_NOTHING, db_column='id_promocion')
    id_categoria = models.ForeignKey(Categoria, models.DO_NOTHING, db_column='id_categoria')

    class Meta:
        # managed = False
        db_table = 'promocion_categoria'


class SolicitudNegocio(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_negocio = models.ForeignKey(Negocio, models.DO_NOTHING, db_column='id_negocio', blank=True, null=True)
    estatus = models.CharField(max_length=20, choices=[('pendiente', 'Pendiente'), ('aprobado', 'Aprobado'), ('rechazado', 'Rechazado')], default='pendiente')

    class Meta:
        # managed = False
        db_table = 'solicitud_negocio'


class SolicitudNegocioDetalle(models.Model):
    pk = models.CompositePrimaryKey('id_solicitud', 'fecha_creado')
    id_solicitud = models.ForeignKey(SolicitudNegocio, models.DO_NOTHING, db_column='id_solicitud')
    fecha_creado = models.DateTimeField(auto_now_add=True)
    id_administrador = models.ForeignKey(Administrador, models.DO_NOTHING, db_column='id_administrador')
    es_aprobado = models.IntegerField()
    num_intento = models.IntegerField()
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        # managed = False
        db_table = 'solicitud_negocio_detalle'

class Suscripcion(models.Model):
    pk = models.CompositePrimaryKey('id_usuario', 'id_negocio')
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario')
    id_negocio = models.ForeignKey(Negocio, models.DO_NOTHING, db_column='id_negocio')
    fecha_creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        # managed = False
        db_table = 'suscripcion'


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
    tipo = models.CharField(max_length=30, choices=[
        ('colaborador', 'Colaborador'),
        ('administrador', 'Administrador'),
        ('cajero', 'Cajero'),
        ('usuario', 'Usuario'),
    ], default='usuario')

    class Meta:
        # managed = False
        db_table = 'usuario'

class CodigoQR(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_usuario = models.ForeignKey(Usuario, models.DO_NOTHING, db_column='id_usuario')
    id_promocion = models.ForeignKey(Promocion, models.DO_NOTHING, db_column='id_promocion')
    codigo = models.TextField()
    fecha_creado = models.DateTimeField(auto_now_add=True)
    utilizado = models.BooleanField(default=False)

    class Meta:
        # managed = False
        db_table = 'codigo_qr'