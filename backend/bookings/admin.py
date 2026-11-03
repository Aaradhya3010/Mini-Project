from django.contrib import admin
from .models import EquipmentAllocation


@admin.register(EquipmentAllocation)
class EquipmentAllocationAdmin(admin.ModelAdmin):
    list_display = ('event', 'equipment', 'quantity')
    list_filter = ('equipment',)
    search_fields = ('event__title', 'equipment__name')
