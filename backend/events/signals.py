import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Event, Registration
from notifications.models import Notification

logger = logging.getLogger(__name__)
User = get_user_model()


def send_notification_and_email(user, message, subject="Smart Campus Portal Notification"):
    # Create database notification
    Notification.objects.create(user=user, message=message)
    # Send email (console email backend in dev)
    try:
        if user.email:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@campus.edu'),
                recipient_list=[user.email],
                fail_silently=True,
            )
    except Exception as e:
        logger.warning(f"Failed to send email to {user.email}: {e}")


@receiver(pre_save, sender=Event)
def track_event_status_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            previous = Event.objects.get(pk=instance.pk)
            instance._previous_status = previous.status
        except Event.DoesNotExist:
            instance._previous_status = None
    else:
        instance._previous_status = None


@receiver(post_save, sender=Event)
def handle_event_notifications(sender, instance, created, **kwargs):
    # 1. Event submitted (created with PENDING status) -> notify admins
    if created and instance.status == Event.Status.PENDING:
        admin_users = User.objects.filter(role=User.Role.ADMIN) | User.objects.filter(is_superuser=True)
        admin_users = admin_users.distinct()
        for admin in admin_users:
            msg = f"New event '{instance.title}' submitted for approval by {instance.organizer.username}."
            send_notification_and_email(admin, msg, subject="New Event Pending Approval")

    # Status changes on update
    previous_status = getattr(instance, '_previous_status', None)
    if not created and previous_status and previous_status != instance.status:
        # 2. Approved
        if instance.status == Event.Status.APPROVED:
            msg = f"Your event '{instance.title}' has been approved."
            send_notification_and_email(instance.organizer, msg, subject="Event Approved")

        # 3. Rejected
        elif instance.status == Event.Status.REJECTED:
            msg = f"Your event '{instance.title}' has been rejected."
            send_notification_and_email(instance.organizer, msg, subject="Event Rejected")

        # 4. Cancelled -> notify all registrants
        elif instance.status == Event.Status.CANCELLED:
            registrations = instance.registrations.select_related('user').all()
            for reg in registrations:
                msg = f"The event '{instance.title}' you registered for has been cancelled."
                send_notification_and_email(reg.user, msg, subject="Event Cancelled")


@receiver(post_save, sender=Registration)
def handle_registration_confirmed(sender, instance, created, **kwargs):
    if created:
        msg = f"You have successfully registered for '{instance.event.title}'."
        send_notification_and_email(instance.user, msg, subject="Registration Confirmed")
