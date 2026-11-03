from django.contrib import admin
from .models import Hall, Equipment


@admin.register(Hall)
class HallAdmin(admin.ModelAdmin):
    list_display = ('name', 'capacity', 'location', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'location')


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'total_quantity', 'description')
    search_fields = ('name',)
