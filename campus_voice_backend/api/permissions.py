from functools import wraps
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework import status


METHOD_ACTION_MAP = {
    'GET': 'view',
    'HEAD': 'view',
    'OPTIONS': 'view',
    'POST': 'create',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete',
}


class HasResourcePermission(BasePermission):
    message = "You do not have permission to perform this action."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_staff:
            return False
        
        resource = getattr(view, 'resource', None)
        if not resource:
            return True
        
        action = getattr(view, 'action', None)
        if not action:
            action = METHOD_ACTION_MAP.get(request.method, 'view')
        
        return user_has_permission(request.user, resource, action)


def user_has_permission(user, resource: str, action: str) -> bool:
    from api.models import UserRole, Permission
    
    user_roles = UserRole.objects.filter(user=user).select_related('role')
    
    if not user_roles.exists():
        return False
    
    for user_role in user_roles:
        role = user_role.role
        
        if role.is_superadmin:
            return True
        
        if role.permissions.filter(resource=resource, action=action).exists():
            return True
    
    return False


def get_user_permissions(user) -> set:
    from api.models import UserRole
    
    user_roles = UserRole.objects.filter(user=user).select_related('role').prefetch_related('role__permissions')
    
    permissions = set()
    
    for user_role in user_roles:
        role = user_role.role
        
        if role.is_superadmin:
            return {'*'}
        
        for perm in role.permissions.all():
            permissions.add(f"{perm.resource}.{perm.action}")
    
    return permissions


def is_superadmin(user) -> bool:
    from api.models import UserRole
    
    return UserRole.objects.filter(
        user=user,
        role__is_superadmin=True
    ).exists()


def admin_permission(resource: str, action: str):
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


class HasAnyPermission(BasePermission):
    
    message = "You do not have permission to perform this action."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_staff:
            return False
        
        required = getattr(view, 'required_permissions', [])
        if not required:
            return True
        
        user_perms = get_user_permissions(request.user)
        
        if '*' in user_perms:
            return True
        
        return bool(user_perms & set(required))


class HasAllPermissions(BasePermission):
    
    message = "You do not have all required permissions to perform this action."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_staff:
            return False
        
        required = getattr(view, 'required_permissions', [])
        if not required:
            return True
        
        user_perms = get_user_permissions(request.user)
        
        if '*' in user_perms:
            return True
        
        return set(required).issubset(user_perms)