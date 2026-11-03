from rest_framework import viewsets, permissions
from .models import EquipmentAllocation
from .serializers import EquipmentAllocationSerializer
from campus.permissions import IsFacultyOrAdmin, IsEventOrganizerOrAdmin


class EquipmentAllocationViewSet(viewsets.ModelViewSet):
    queryset = EquipmentAllocation.objects.select_related('equipment', 'event').all()
    serializer_class = EquipmentAllocationSerializer
    filterset_fields = ['event', 'equipment']

    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [IsFacultyOrAdmin]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsEventOrganizerOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [perm() for perm in permission_classes]
