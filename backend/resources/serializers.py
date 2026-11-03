from rest_framework import serializers
from .models import Hall, Equipment


class HallSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hall
        fields = ['id', 'name', 'capacity', 'location', 'is_active']


class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = ['id', 'name', 'total_quantity', 'description']
