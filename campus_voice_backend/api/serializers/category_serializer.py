from rest_framework import serializers
from api.models import Category


class PublicCategoryListSerializer(serializers.ModelSerializer):
    """Serializer for Student to Choose Category model"""
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'priority_level', 'is_active']
        read_only_fields = ['id']

class CategorySerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'priority_level', 'is_active']
        read_only_fields = ['id']


class CategoryDetailSerializer(CategorySerializer):
    """Detailed serializer for Category with ticket count"""

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'priority_level', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

