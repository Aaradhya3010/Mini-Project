from django.db.models import Q
from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from .models import Event, Registration
from .serializers import EventSerializer, RegistrationSerializer
from .filters import EventFilter
from campus.permissions import IsAdminRole, IsFacultyOrAdmin, IsEventOrganizerOrAdmin


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    filterset_class = EventFilter
    search_fields = ['title', 'description', 'hall__name', 'organizer__username']
    ordering_fields = ['start', 'end', 'created_at', 'expected_attendees']

    def get_queryset(self):
        user = self.request.user
        queryset = Event.objects.select_related('hall', 'organizer').prefetch_related(
            'equipment_allocations__equipment', 'registrations'
        )

        if not user.is_authenticated:
            return queryset.filter(status=Event.Status.APPROVED)

        if user.role == 'ADMIN' or user.is_staff or user.is_superuser:
            return queryset.all()

        if user.role == 'FACULTY':
            # Faculty sees all approved events + all events they organized
            return queryset.filter(
                Q(status=Event.Status.APPROVED) | Q(organizer=user)
            ).distinct()

        # Student sees all approved events + events they registered for
        return queryset.filter(
            Q(status=Event.Status.APPROVED) | Q(registrations__user=user)
        ).distinct()

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [IsFacultyOrAdmin]
        elif self.action in ['update', 'partial_update', 'destroy', 'cancel']:
            permission_classes = [IsEventOrganizerOrAdmin]
        elif self.action in ['approve', 'reject']:
            permission_classes = [IsAdminRole]
        elif self.action in ['register', 'unregister']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        return [perm() for perm in permission_classes]

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    @decorators.action(detail=True, methods=['post'], permission_classes=[IsAdminRole])
    def approve(self, request, pk=None):
        event = self.get_object()
        if event.status == Event.Status.APPROVED:
            return Response({'detail': 'Event is already approved.'}, status=status.HTTP_400_BAD_REQUEST)

        # Re-check hall conflict prior to approving
        overlapping = Event.objects.filter(
            hall=event.hall,
            status=Event.Status.APPROVED,
            start__lt=event.end,
            end__gt=event.start,
        ).exclude(pk=event.pk)

        if overlapping.exists():
            conflict = overlapping.first()
            return Response({
                'detail': f"Cannot approve: Hall '{event.hall.name}' conflicts with approved event '{conflict.title}'."
            }, status=status.HTTP_400_BAD_REQUEST)

        event.status = Event.Status.APPROVED
        event.save()
        return Response(EventSerializer(event, context={'request': request}).data)

    @decorators.action(detail=True, methods=['post'], permission_classes=[IsAdminRole])
    def reject(self, request, pk=None):
        event = self.get_object()
        event.status = Event.Status.REJECTED
        event.save()
        return Response(EventSerializer(event, context={'request': request}).data)

    @decorators.action(detail=True, methods=['post'], permission_classes=[IsEventOrganizerOrAdmin])
    def cancel(self, request, pk=None):
        event = self.get_object()
        if event.status == Event.Status.CANCELLED:
            return Response({'detail': 'Event is already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
        event.status = Event.Status.CANCELLED
        event.save()
        return Response(EventSerializer(event, context={'request': request}).data)

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def register(self, request, pk=None):
        event = self.get_object()
        if event.status != Event.Status.APPROVED:
            return Response({'detail': 'Can only register for approved events.'}, status=status.HTTP_400_BAD_REQUEST)

        if Registration.objects.filter(user=request.user, event=event).exists():
            return Response({'detail': 'You are already registered for this event.'}, status=status.HTTP_400_BAD_REQUEST)

        current_count = event.registrations.count()
        if current_count >= event.expected_attendees:
            return Response({'detail': 'This event has reached full capacity.'}, status=status.HTTP_400_BAD_REQUEST)

        registration = Registration.objects.create(user=request.user, event=event)
        return Response({
            'detail': 'Registration confirmed successfully.',
            'registration': RegistrationSerializer(registration).data,
            'event': EventSerializer(event, context={'request': request}).data,
        }, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unregister(self, request, pk=None):
        event = self.get_object()
        reg = Registration.objects.filter(user=request.user, event=event).first()
        if not reg:
            return Response({'detail': 'You are not registered for this event.'}, status=status.HTTP_400_BAD_REQUEST)

        reg.delete()
        return Response({
            'detail': 'Successfully unregistered from the event.',
            'event': EventSerializer(event, context={'request': request}).data,
        }, status=status.HTTP_200_OK)


class RegistrationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_staff or user.is_superuser:
            return Registration.objects.all()
        return Registration.objects.filter(user=user)
