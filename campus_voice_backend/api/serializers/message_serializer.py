from rest_framework import serializers
from api.models import Message


class PublicMessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model"""
    sender_info = serializers.SerializerMethodField()
    is_staff_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id',
            'ticket',
            'sender',
            'sender_info',
            'content',
            'attachment',
            'attachment_name',
            'is_staff_message',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'sender', 'is_staff_message', 'created_at', 'updated_at']

    def get_sender_info(self, obj):
        
        return obj.sender.get_full_name() or obj.sender.email

    def get_is_staff_message(self, obj):
        return obj.sender.is_staff

class AdminMessageSerializer(serializers.ModelSerializer):
    """Staff sees everything including internal notes."""
    sender_info = serializers.SerializerMethodField()
    is_staff_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id',
            'ticket',
            'sender',
            'sender_info',
            'content',
            'attachment',
            'is_staff_message',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'sender', 'created_at', 'updated_at']

    def get_sender_info(self, obj):
        """Return anonymized sender info only show role and name for staff"""
        return obj.sender.get_full_name() or obj.sender.email
