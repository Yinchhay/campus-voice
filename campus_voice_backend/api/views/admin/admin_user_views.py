from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.permissions import HasResourcePermission, invalidate_permission_cache
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q

from api.models import AdminRole, UserRole
from api.serializers import AdminUserSerializer
from api.utils import CustomPageNumberPagination, get_paginated_response

User = get_user_model()
    
class AdminUserListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'user'
    
    def get(self, request):
        filters = request.query_params.get('filters', '')
        sort_by = request.query_params.get('sort_by', 'created_at')
        sort_desc = request.query_params.get('sort_desc', 'true').lower() == 'true'

        users = (
            User.objects
            .filter(role__in=[User.Role.STAFF, User.Role.ADMIN])
            .prefetch_related('admin_roles__role__permissions')
        )
        
        if filters:
            users = users.filter(
                Q(email__icontains=filters) |
                Q(first_name__icontains=filters) |
                Q(last_name__icontains=filters)
            )

        allowed_sort_fields = ['created_at', 'email', 'first_name', 'last_name']
        if sort_by not in allowed_sort_fields:
            sort_by = 'created_at'

        order_field = f'-{sort_by}' if sort_desc else sort_by
        users = users.order_by(order_field)

        return get_paginated_response(users, request, AdminUserSerializer)
        
        
    @transaction.atomic
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = User.objects.create_user(
            username=email.split('@')[0], 
            email = email,
            first_name = request.data.get('first_name', ''),
            last_name = request.data.get('last_name', ''),
            is_active = request.data.get('is_active', True),
            is_staff = request.data.get('is_staff', True),
            role = request.data.get('role', User.Role.STAFF),
            password = request.data.get('password') or User.objects.make_random_password(),
        )
        
        generated_password = None
        if 'password' not in request.data:
            generated_password = User.objects.make_random_password()
            user.set_password(generated_password)
            user.save()
        
        role_ids = request.data.get('role_ids', [])
        for role_id in role_ids:
            try:
                role = AdminRole.objects.get(id=role_id)
                UserRole.objects.get_or_create(
                    user=user,
                    role=role,
                    defaults={'assigned_by': request.user}
                )
            except AdminRole.DoesNotExist:
                pass
        
        serializer = AdminUserSerializer(user)
        response_data = serializer.data
        
        if generated_password:
            response_data['generated_password'] = generated_password
        
        return Response(response_data, status=status.HTTP_201_CREATED)


class AdminUserDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'user'

    def get(self, request, user_id):
        try:
            user = User.objects.prefetch_related('admin_roles__role__permissions').get(id=user_id)
            serializer = AdminUserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @transaction.atomic
    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            
            if 'first_name' in request.data:
                user.first_name = request.data['first_name']
            if 'last_name' in request.data:
                user.last_name = request.data['last_name']
            if 'is_active' in request.data:
                user.is_active = request.data['is_active']
            if 'is_staff' in request.data:
                user.is_staff = request.data['is_staff']
            if 'role' in request.data:
                user.role = request.data['role']
                
            if 'email' in request.data:
                new_email = request.data['email']
                if User.objects.filter(email=new_email).exclude(id=user_id).exists():
                    return Response(
                        {'error': 'Email already in use by another user'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                user.email = new_email
                
            if 'is_superuser' in request.data:
                user.is_superuser = request.data['is_superuser']
                
            if 'password' in request.data:
                user.set_password(request.data['password'])
            
            if 'role_ids' in request.data:
                role_ids = request.data['role_ids']
                UserRole.objects.filter(user=user).delete()
                for role_id in role_ids:
                    try:
                        role = AdminRole.objects.get(id=role_id)
                        UserRole.objects.create(
                            user=user,
                            role=role,
                            assigned_by=request.user
                        )
                    except AdminRole.DoesNotExist:
                        pass
                invalidate_permission_cache(user_id)
            
            user.save()
            serializer = AdminUserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            if not user:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            if user.id == request.user.id:
                return Response(
                    {'error': 'You cannot delete your own account'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user_email = user.email
            user.delete()
            
            return Response(
                {'message': f'User {user_email} deleted successfully'}, 
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )