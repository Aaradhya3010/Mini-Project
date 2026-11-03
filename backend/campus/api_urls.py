from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import RegisterView, CustomTokenObtainPairView, CurrentUserView
from resources.views import HallViewSet, EquipmentViewSet
from events.views import EventViewSet, RegistrationViewSet
from bookings.views import EquipmentAllocationViewSet
from notifications.views import NotificationViewSet

router = DefaultRouter()
router.register(r'halls', HallViewSet, basename='hall')
router.register(r'equipment', EquipmentViewSet, basename='equipment')
router.register(r'events', EventViewSet, basename='event')
router.register(r'registrations', RegistrationViewSet, basename='registration')
router.register(r'allocations', EquipmentAllocationViewSet, basename='allocation')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),

    # ViewSet router endpoints
    path('', include(router.urls)),
]
