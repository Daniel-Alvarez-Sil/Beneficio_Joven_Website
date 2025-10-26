# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción:
#   Este módulo define el modelo de usuario personalizado para el sistema.
#   Extiende la clase base AbstractUser de Django para incluir el campo 'tipo',
#   el cual permite distinguir entre diferentes roles de usuario dentro de la
#   aplicación (colaborador, administrador, cajero, usuario).
# =============================================================================

from django.contrib.auth.models import AbstractUser
from django.db import models


# =============================================================================
# Clase: User
# Descripción:
#   Modelo de usuario personalizado que extiende las funcionalidades del modelo
#   de Django (AbstractUser). Se utiliza para controlar la autenticación y los
#   diferentes tipos de usuario en el sistema.
# =============================================================================
class User(AbstractUser):
    """
    Modelo de usuario extendido basado en AbstractUser.

    Este modelo agrega el campo `tipo` para clasificar los roles de usuario:
    - colaborador
    - administrador
    - cajero
    - usuario

    Atributos:
        tipo (str): Define el tipo o rol del usuario dentro del sistema.
    """

    # -------------------------------------------------------------------------
    # Campo: tipo
    # -------------------------------------------------------------------------
    # Define el rol del usuario dentro de la aplicación.
    # Se restringe mediante un conjunto de opciones (choices) predefinidas.
    tipo = models.CharField(
        max_length=30,
        choices=[
            ('colaborador', 'Colaborador'),
            ('administrador', 'Administrador'),
            ('cajero', 'Cajero'),
            ('usuario', 'Usuario'),
        ],
        default='usuario',  # Valor predeterminado
        help_text="Define el rol del usuario dentro del sistema.",
    )

    # -------------------------------------------------------------------------
    # Método: __str__
    # -------------------------------------------------------------------------
    def __str__(self):
        """
        Retorna una representación legible del usuario.
        Por defecto, se devuelve el nombre de usuario.
        """
        return self.username
