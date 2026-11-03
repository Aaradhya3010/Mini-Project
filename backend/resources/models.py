from django.db import models


class Hall(models.Model):
    name = models.CharField(max_length=150, unique=True)
    capacity = models.PositiveIntegerField()
    location = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} (Cap: {self.capacity}, {self.location})"


class Equipment(models.Model):
    name = models.CharField(max_length=150, unique=True)
    total_quantity = models.PositiveIntegerField(default=1)
    description = models.TextField(blank=True, default='')

    class Meta:
        verbose_name_plural = 'Equipment'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} (Total: {self.total_quantity})"
