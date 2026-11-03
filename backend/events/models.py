from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Event(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        CANCELLED = 'CANCELLED', 'Cancelled'

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organized_events',
    )
    hall = models.ForeignKey(
        'resources.Hall',
        on_delete=models.CASCADE,
        related_name='events',
    )
    start = models.DateTimeField()
    end = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    expected_attendees = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start']

    def __str__(self):
        return f"{self.title} ({self.get_status_display()}) at {self.hall.name}"

    def clean(self):
        super().clean()

        if self.start and self.end:
            if self.end <= self.start:
                raise ValidationError({'end': 'End time must be after start time.'})

        if self.hall and self.expected_attendees:
            if self.expected_attendees > self.hall.capacity:
                raise ValidationError({
                    'expected_attendees': (
                        f'Expected attendees ({self.expected_attendees}) cannot exceed '
                        f'hall capacity ({self.hall.capacity}).'
                    )
                })

        # Conflict check applies when status is PENDING or APPROVED
        if self.hall and self.start and self.end and self.status in [self.Status.PENDING, self.Status.APPROVED]:
            overlapping = Event.objects.filter(
                hall=self.hall,
                status__in=[self.Status.PENDING, self.Status.APPROVED],
                start__lt=self.end,
                end__gt=self.start,
            )
            if self.pk:
                overlapping = overlapping.exclude(pk=self.pk)

            if overlapping.exists():
                conflict = overlapping.first()
                raise ValidationError({
                    'non_field_errors': (
                        f"Hall '{self.hall.name}' is already booked by '{conflict.title}' "
                        f"({conflict.start.strftime('%Y-%m-%d %H:%M')} to {conflict.end.strftime('%H:%M')})."
                    )
                })


class Registration(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='event_registrations',
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='registrations',
    )
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'event')
        ordering = ['-registered_at']

    def __str__(self):
        return f"{self.user.username} registered for {self.event.title}"
