import django_filters
from .models import Event


class EventFilter(django_filters.FilterSet):
    date = django_filters.DateFilter(field_name='start', lookup_expr='date')
    start_after = django_filters.DateTimeFilter(field_name='start', lookup_expr='gte')
    end_before = django_filters.DateTimeFilter(field_name='end', lookup_expr='lte')
    status = django_filters.ChoiceFilter(choices=Event.Status.choices)
    hall = django_filters.NumberFilter(field_name='hall_id')
    organizer = django_filters.NumberFilter(field_name='organizer_id')

    class Meta:
        model = Event
        fields = ['date', 'start_after', 'end_before', 'status', 'hall', 'organizer']
