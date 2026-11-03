from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers
from .models import Event, Registration
from resources.models import Hall, Equipment
from resources.serializers import HallSerializer
from bookings.models import EquipmentAllocation
from accounts.serializers import UserSerializer


class RegistrationSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Registration
        fields = ['id', 'user', 'user_details', 'event', 'registered_at']
        read_only_fields = ['id', 'user', 'registered_at']


class EventEquipmentItemSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    total_quantity = serializers.IntegerField(source='equipment.total_quantity', read_only=True)

    class Meta:
        model = EquipmentAllocation
        fields = ['id', 'equipment', 'equipment_name', 'total_quantity', 'quantity']


class EventAllocationInputSerializer(serializers.Serializer):
    equipment = serializers.PrimaryKeyRelatedField(queryset=Equipment.objects.all())
    quantity = serializers.IntegerField(min_value=1)


class EventSerializer(serializers.ModelSerializer):
    organizer_details = UserSerializer(source='organizer', read_only=True)
    organizer_name = serializers.CharField(source='organizer.username', read_only=True)
    hall_details = HallSerializer(source='hall', read_only=True)
    equipment_allocations = EventEquipmentItemSerializer(many=True, read_only=True)
    registrations_count = serializers.SerializerMethodField()
    is_registered_by_me = serializers.SerializerMethodField()
    # Write-only nested equipment allocations list
    requested_equipment = EventAllocationInputSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'description',
            'organizer',
            'organizer_name',
            'organizer_details',
            'hall',
            'hall_details',
            'start',
            'end',
            'status',
            'expected_attendees',
            'equipment_allocations',
            'requested_equipment',
            'registrations_count',
            'is_registered_by_me',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'organizer', 'created_at', 'updated_at', 'status']

    def get_registrations_count(self, obj):
        return obj.registrations.count()

    def get_is_registered_by_me(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.registrations.filter(user=request.user).exists()

    def validate(self, attrs):
        start = attrs.get('start') or (self.instance.start if self.instance else None)
        end = attrs.get('end') or (self.instance.end if self.instance else None)
        hall = attrs.get('hall') or (self.instance.hall if self.instance else None)
        expected_attendees = attrs.get('expected_attendees') or (self.instance.expected_attendees if self.instance else None)
        status = attrs.get('status') or (self.instance.status if self.instance else Event.Status.PENDING)

        # 1. Time range check
        if start and end and end <= start:
            raise serializers.ValidationError({'end': 'End time must be after start time.'})

        # 2. Capacity check
        if hall and expected_attendees is not None:
            if expected_attendees > hall.capacity:
                raise serializers.ValidationError({
                    'expected_attendees': f"Expected attendees ({expected_attendees}) exceeds hall capacity ({hall.capacity})."
                })

        # 3. Hall conflict check (for PENDING or APPROVED events)
        if hall and start and end and status in [Event.Status.PENDING, Event.Status.APPROVED]:
            overlapping = Event.objects.filter(
                hall=hall,
                status__in=[Event.Status.PENDING, Event.Status.APPROVED],
                start__lt=end,
                end__gt=start,
            )
            if self.instance:
                overlapping = overlapping.exclude(pk=self.instance.pk)

            if overlapping.exists():
                conflict = overlapping.first()
                start_str = conflict.start.strftime('%Y-%m-%d %H:%M')
                end_str = conflict.end.strftime('%H:%M')
                raise serializers.ValidationError({
                    'hall': f"Hall '{hall.name}' is already booked by '{conflict.title}' ({start_str} - {end_str})."
                })

        # 4. Equipment allocations validation
        requested_equipment = attrs.get('requested_equipment', None)
        if requested_equipment is not None and start and end:
            for item in requested_equipment:
                equip = item['equipment']
                qty = item['quantity']

                overlapping_allocs = EquipmentAllocation.objects.filter(
                    equipment=equip,
                    event__status__in=[Event.Status.PENDING, Event.Status.APPROVED],
                    event__start__lt=end,
                    event__end__gt=start,
                )
                if self.instance:
                    overlapping_allocs = overlapping_allocs.exclude(event=self.instance)

                allocated_sum = overlapping_allocs.aggregate(total=Sum('quantity'))['total'] or 0
                available = equip.total_quantity - allocated_sum

                if qty > available:
                    raise serializers.ValidationError({
                        'requested_equipment': (
                            f"Requested {qty} '{equip.name}', but only {max(0, available)} "
                            f"are available during this time slot."
                        )
                    })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        requested_equipment = validated_data.pop('requested_equipment', [])
        # Assign organizer from request user if not explicitly passed
        if 'organizer' not in validated_data and 'request' in self.context:
            validated_data['organizer'] = self.context['request'].user

        event = super().create(validated_data)

        # Create equipment allocations
        for item in requested_equipment:
            EquipmentAllocation.objects.create(
                event=event,
                equipment=item['equipment'],
                quantity=item['quantity'],
            )

        return event

    @transaction.atomic
    def update(self, instance, validated_data):
        requested_equipment = validated_data.pop('requested_equipment', None)
        event = super().update(instance, validated_data)

        if requested_equipment is not None:
            # Recreate allocations
            instance.equipment_allocations.all().delete()
            for item in requested_equipment:
                EquipmentAllocation.objects.create(
                    event=event,
                    equipment=item['equipment'],
                    quantity=item['quantity'],
                )

        return event
