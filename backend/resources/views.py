from django.db.models import Sum
from rest_framework import viewsets, permissions, decorators, response
from .models import Hall, Equipment
from .serializers import HallSerializer, EquipmentSerializer
from campus.permissions import ReadOnlyOrAdmin
from bookings.models import EquipmentAllocation


class HallViewSet(viewsets.ModelViewSet):
    queryset = Hall.objects.all()
    serializer_class = HallSerializer
    permission_classes = [ReadOnlyOrAdmin]
    filterset_fields = ['is_active']
    search_fields = ['name', 'location']
    ordering_fields = ['name', 'capacity']


class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [ReadOnlyOrAdmin]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'total_quantity']

    @decorators.action(detail=False, methods=['get'], url_path='availability')
    def check_availability(self, request):
        """
        Calculates equipment availability for a requested start and end window.
        Query params: start (ISO string), end (ISO string), exclude_event (optional ID)
        """
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        exclude_event_id = request.query_params.get('exclude_event')

        items = []
        for eq in Equipment.objects.all():
            available = eq.total_quantity
            if start and end:
                allocs = EquipmentAllocation.objects.filter(
                    equipment=eq,
                    event__status__in=['PENDING', 'APPROVED'],
                    event__start__lt=end,
                    event__end__gt=start,
                )
                if exclude_event_id:
                    allocs = allocs.exclude(event_id=exclude_event_id)
                reserved = allocs.aggregate(total=Sum('quantity'))['total'] or 0
                available = max(0, eq.total_quantity - reserved)

            items.append({
                'id': eq.id,
                'name': eq.name,
                'total_quantity': eq.total_quantity,
                'available_quantity': available,
                'description': eq.description,
            })

        return response.Response(items)
