from django.contrib import admin
from .models import Event, Registration


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'hall', 'organizer', 'start', 'end', 'status', 'expected_attendees')
    list_filter = ('status', 'hall', 'start')
    search_fields = ('title', 'description', 'organizer__username')


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'registered_at')
    list_filter = ('registered_at',)
    search_fields = ('user__username', 'event__title')
