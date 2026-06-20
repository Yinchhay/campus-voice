from functools import wraps
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache


METHOD_ACTION_MAP = {
    'GET':     'view',
    'HEAD':    'view',
    'OPTIONS': 'view',
    'POST':    'create',
    'PUT':     'update',
    'PATCH':   'update',
    'DELETE':  'delete',
}


def user_has_permission(user, resource: str, action: str) -> bool:
    from api.models import UserRole

    # Admin role = superadmin, bypasses all permission checks
    if user.is_superadmin:
        return True
    
    cache_key = f"user_perm:{user.id}:{resource}:{action}"
    result = cache.get(cache_key)
    if result is not None:
        return result
    # Staff — check their assigned role permissions
    result = UserRole.objects.filter(
        user=user,
        role__permissions__resource=resource,
        role__permissions__action=action,
    ).exists()

    cache.set(cache_key, result, timeout=300)  # Cache for 5 minutes
    return result


def invalidate_permission_cache(user_id=None):
    """Clear permission cache. If user_id given, clear only that user's cache."""
    if user_id:
        cache.delete_pattern(f"user_perm:{user_id}:*")
    else:
        cache.delete_pattern("user_perm:*")


def get_user_permissions(user) -> set:
    from api.models import UserRole

    if user.is_superadmin:
        return {'*'}

    user_roles = (
        UserRole.objects
        .filter(user=user)
        .prefetch_related('role__permissions')
    )

    permissions = set()
    for ur in user_roles:
        for perm in ur.role.permissions.all():
            permissions.add(perm.codename)
    return permissions


def is_superadmin(user) -> bool:
    return user.role == 'ADMIN'


# ── Permission Classes ────────────────────────────────────────────────────────

class IsAdminSide(BasePermission):
    """Allows access to any user with is_staff=True (Staff or Admin)."""
    message = "Admin access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )


class HasResourcePermission(BasePermission):
    """
    Checks resource + action permission.
    Admin (superadmin) always passes.
    Staff must have the matching permission in their role.
    """
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if not request.user.is_staff:
            return False

        resource = getattr(view, 'resource', None)
        if not resource:
            return True

        action = getattr(view, 'action_override', None)
        if not action:
            action = METHOD_ACTION_MAP.get(request.method, 'view')

        return user_has_permission(request.user, resource, action)


class HasAnyPermission(BasePermission):
    """User needs at least ONE of the required_permissions."""
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not request.user.is_staff:
            return False
        if request.user.is_superadmin:
            return True

        required     = getattr(view, 'required_permissions', [])
        user_perms   = get_user_permissions(request.user)
        return bool(user_perms & set(required))


class HasAllPermissions(BasePermission):
    """User needs ALL of the required_permissions."""
    message = "You do not have all required permissions."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not request.user.is_staff:
            return False
        if request.user.is_superadmin:
            return True

        required   = set(getattr(view, 'required_permissions', []))
        user_perms = get_user_permissions(request.user)
        return required.issubset(user_perms)


# ── Decorator ─────────────────────────────────────────────────────────────────

def admin_permission(resource: str, action: str):
    """Per-method permission decorator."""
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(self, request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if not request.user.is_staff:
                return Response(
                    {'error': 'Admin access required'},
                    status=status.HTTP_403_FORBIDDEN
                )
            if not user_has_permission(request.user, resource, action):
                return Response(
                    {'error': f'Permission denied: {resource}.{action}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return view_func(self, request, *args, **kwargs)
        return wrapped_view
    return decorator