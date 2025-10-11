from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Colaborador, Administrador, Cajero o Usuario
    tipo = models.CharField(max_length=30, choices=[
        ('colaborador', 'Colaborador'),
        ('administrador', 'Administrador'),
        ('cajero', 'Cajero'),
        ('usuario', 'Usuario'),
    ], default='usuario')

    def __str__(self):
        return self.username
