from rest_framework import serializers
from django.db.models import Sum
from .models import EquipmentAllocation
from resources.models import Equipment
from resources.serializers import EquipmentSerializer


class EquipmentAllocationSerializer(serializers.ModelSerializer):
    equipment_details = EquipmentSerializer(source='equipment', read_only=True)
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)

    class Meta:
        model = EquipmentAllocation
        fields = ['id', 'event', 'equipment', 'equipment_name', 'equipment_details', 'quantity']

    def validate(self, attrs):
        event = attrs.get('event') or (self.instance.event if self.instance else None)
        equipment = attrs.get('equipment') or (self.instance.equipment if self.instance else None)
        quantity = attrs.get('quantity') or (self.instance.quantity if self.instance else 1)

        if not event or not equipment:
            return attrs

        if quantity <= 0:
            raise serializers.ValidationError({'quantity': 'Quantity must be at least 1.'})

        # Find overlapping events with status PENDING or APPROVED
        overlapping = EquipmentAllocation.objects.filter(
            equipment=equipment,
            event__status__in=['PENDING', 'APPROVED'],
            event__start__lt=event.end,
            event__end__gt=event.start,
        )

        if self.instance:
            overlapping = overlapping.exclude(pk=self.instance.pk)

        allocated_count = overlapping.aggregate(total=Sum('quantity'))['total'] or 0
        available_quantity = equipment.total_quantity - allocated_count

        if quantity > available_quantity:
            raise serializers.ValidationError({
                'quantity': (
                    f"Requested {quantity} '{equipment.name}', but only {max(0, available_quantity)} "
                    f"are available during this time slot."
                )
            })

        return attrs
