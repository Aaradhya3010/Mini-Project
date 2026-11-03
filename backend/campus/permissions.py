from rest_framework import permissions


class IsAdminRole(permissions.BasePermission):
    """Allows access only to users with role ADMIN or superusers."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and (
                request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser
            )
        )


class IsFacultyOrAdmin(permissions.BasePermission):
    """Allows access to Faculty or Admin users for event creation/booking."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in ['FACULTY', 'ADMIN'] or request.user.is_staff or request.user.is_superuser


class IsEventOrganizerOrAdmin(permissions.BasePermission):
    """
    Object-level permission allowing the event organizer or an admin to edit/delete.
    """
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser:
            return True
        # For Event objects
        if hasattr(obj, 'organizer'):
            return obj.organizer == request.user
        # For EquipmentAllocation objects
        if hasattr(obj, 'event'):
            return obj.event.organizer == request.user
        return False


class ReadOnlyOrAdmin(permissions.BasePermission):
    """
    Allows read-only access for all users (public browsing), but write access only to ADMIN.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user and request.user.is_authenticated and (
                request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser
            )
        )
