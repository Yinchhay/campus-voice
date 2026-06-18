from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAdminUser
from django.db import transaction
from django.db.models import Count
from django.contrib.auth import get_user_model

from api.models import AdminRole, Permission, UserRole
from api.serializers.admin_serializers import (
    AdminRoleSerializer,
    AdminRoleDetailSerializer,
    PermissionSerializer,
    UserRoleSerializer,
)
from api.permissions import HasResourcePermission
from django.db.models import Q
from api.utils import get_paginated_response

User = get_user_model()

class AdminRoleListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'role'
    
    def get(self, request):
        filters = request.query_params.get('filters', '')
        sort_by = request.query_params.get('sort_by', 'name')
        sort_desc = request.query_params.get('sort_desc', 'false').lower() == 'true'

        roles = AdminRole.objects.annotate(user_count=Count('user_assignments'))

        if filters:
            roles = roles.filter(
                Q(name__icontains=filters) |
                Q(description__icontains=filters)
            )

        allowed_sort_fields = ['name']
        if sort_by not in allowed_sort_fields:
            sort_by = 'name'

        order_field = f'-{sort_by}' if sort_desc else sort_by
        roles = roles.order_by(order_field)

        return get_paginated_response(roles, request, AdminRoleDetailSerializer)
    
    @transaction.atomic
    def post(self, request):
        serializer = AdminRoleDetailSerializer(data=request.data)
        if serializer.is_valid():
            role = serializer.save()
            return Response(
                AdminRoleDetailSerializer(role).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
class AdminRoleDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes= [HasResourcePermission]
    resource = 'role'
    
    def get(self, request, role_id):
        try:
            role = AdminRole.objects.get(id=role_id)
        except AdminRole.DoesNotExist:
            return Response(
                {'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = AdminRoleDetailSerializer(role)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @transaction.atomic
    def patch(self, request, role_id):
        try:
            role = AdminRole.objects.get(id=role_id)
        except AdminRole.DoesNotExist:
            return Response(
                {'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = AdminRoleDetailSerializer(role, data=request.data, partial=True)
        if serializer.is_valid():
            role = serializer.save()    
            return Response(
                AdminRoleDetailSerializer(role).data,
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @transaction.atomic
    def delete(self, request, role_id):
        try:
            role = AdminRole.objects.get(id=role_id)
        except AdminRole.DoesNotExist:
            return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if role.is_superadmin:
            return Response(
                {'error': 'Cannot delete the Super Admin role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        role_name = role.name
        role.delete()
        return Response(
            {'message': f'Role "{role_name}" deleted successfully'},
            status=status.HTTP_200_OK
        )
        
class AdminPermissionListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'permission'
    
    def get(self, request):
        permissions = Permission.objects.all().order_by('resource', 'action')
        
        grouped = request.query_params.get('grouped', 'false').lower() == 'true'
        if grouped:
            result = {}
            for perm in permissions:
                if perm.resource not in result:
                    result[perm.resource] = []
                result[perm.resource].append(PermissionSerializer(perm).data)
            return Response(result, status=status.HTTP_200_OK)

        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class AdminUserRoleView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'role'
    action = 'update'
    
    def get(self, request, user_id):
        
        user = User.objects.get(id=user_id)
        if not user:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        user_roles = UserRole.objects.filter(user=user).select_related('role', 'assigned_by')
        serializer = UserRoleSerializer(user_roles, many=True)
        return Response({
            'user_id': str(user.id),
            'email': user.email,
            'roles': serializer.data
        }, status=status.HTTP_200_OK)
        
    @transaction.atomic
    def put(self, request, user_id):
        user = self.get_object(user_id)
        if not user:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        role_ids = request.data.get('role_ids', [])
        UserRole.objects.filter(user=user).delete()
        if role_ids:
            roles = AdminRole.objects.filter(id__in=role_ids)
            for role in roles:
                UserRole.objects.create(user=user, role=role, assigned_by=request.user)
        user.is_staff = len(role_ids) > 0
        user.save(update_fields=['is_staff'])
        user_roles = UserRole.objects.filter(user=user).select_related('role', 'assigned_by')
        return Response({
            'message': 'Roles updated successfully',
            'user_id': str(user.id),
            'roles': UserRoleSerializer(user_roles, many=True).data
        }, status=status.HTTP_200_OK)
        

class AdminRolePermissionsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'role'
    action = 'update'
    
    def get(self, request, role_id):
        
        role = AdminRole.objects.get(id=role_id)
        if not role:
            return Response(
                {'error': 'Role not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        permissions = role.permissions.all().order_by('resource', 'action')
        serializer = PermissionSerializer(permissions, many=True)
        
        return Response({
            'role_id': role.id,
            'role_name': role.name,
            'permissions': serializer.data
        }, status=status.HTTP_200_OK)
        
    @transaction.atomic
    def put(self, request, role_id):
        role = AdminRole.objects.get(id=role_id)
        
        if not role:
            return Response(
                {'error': 'Role not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        permission_ids = request.data.get('permission_ids', [])
        role.permissions.clear()
        
        if permission_ids:
            permissions = Permission.objects.filter(id__in=permission_ids)
            role.permissions.set(permissions)
            
        return Response({
            'message': 'Permissions updated successfully',
            'role': AdminRoleDetailSerializer(role).data
        }, status=status.HTTP_200_OK)
        
    @transaction.atomic
    def post(self, request, role_id):
        role = AdminRole.objects.get(id=role_id)
        
        if not role:
            return Response(
                {'error': 'Role not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        permission_ids = request.data.get('permission_ids', [])
        if not permission_ids:
            return Response(
                {'error': 'permission_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        permissions = Permission.objects.filter(id__in=permission_ids)
        role.permissions.add(*permissions)
        return Response({
            'message': f'Added {permissions.count()} permissions to role',
            'role': AdminRoleDetailSerializer(role).data
        }, status=status.HTTP_200_OK)
       
        
    @transaction.atomic
    def delete(self, request, role_id):
        role = AdminRole.objects.get(id=role_id)
        
        if not role:
            return Response(
                {'error': 'Role not found'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        permission_ids = request.data.get('permission_ids', [])
        if not permission_ids:
            return Response(
                {'error': 'permission_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        permissions = Permission.objects.filter(id__in=permission_ids)
        role.permissions.remove(*permissions)
        
        return Response({
            'message': f'Removed {permissions.count()} permissions from role',
            'role': AdminRoleDetailSerializer(role).data
        }, status=status.HTTP_200_OK)
    