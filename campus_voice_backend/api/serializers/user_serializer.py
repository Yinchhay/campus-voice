from rest_framework import serializers
from api.models import User


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class StaffUserSerializer(serializers.ModelSerializer):
    """Serializer for Staff User info - includes full details for dashboard"""
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at', 'last_login']
        read_only_fields = ['id', 'created_at', 'last_login']
