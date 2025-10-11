from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # keep username-based login; add whatever you need:
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=30, blank=True)

    # Example: make email unique (still not the login field)
    email = models.EmailField(unique=True, blank=True, null=True)

    def __str__(self):
        return self.username
