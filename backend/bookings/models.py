from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Sum


class EquipmentAllocation(models.Model):
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='equipment_allocations',
    )
    equipment = models.ForeignKey(
        'resources.Equipment',
        on_delete=models.CASCADE,
        related_name='allocations',
    )
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.quantity}x {self.equipment.name} for {self.event.title}"

    def clean(self):
        super().clean()
        if self.quantity <= 0:
            raise ValidationError({'quantity': 'Allocated quantity must be at least 1.'})

        if not self.equipment_id or not self.event_id:
            return

        event = self.event
        equipment = self.equipment

        if not event.start or not event.end:
            return

        # Check overlapping events that are PENDING or APPROVED
        overlapping_allocations = EquipmentAllocation.objects.filter(
            equipment=equipment,
            event__status__in=['PENDING', 'APPROVED'],
            event__start__lt=event.end,
            event__end__gt=event.start,
        )

        if self.pk:
            overlapping_allocations = overlapping_allocations.exclude(pk=self.pk)
        elif event.pk:
            # If creating but event already has allocations, exclude existing allocations for the same event
            overlapping_allocations = overlapping_allocations.exclude(event=event)

        allocated_count = overlapping_allocations.aggregate(total=Sum('quantity'))['total'] or 0
        available_quantity = equipment.total_quantity - allocated_count

        if self.quantity > available_quantity:
            raise ValidationError({
                'quantity': (
                    f"Requested {self.quantity} '{equipment.name}', but only {max(0, available_quantity)} "
                    f"are available during this time slot (Total: {equipment.total_quantity}, "
                    f"Already reserved: {allocated_count})."
                )
            })
