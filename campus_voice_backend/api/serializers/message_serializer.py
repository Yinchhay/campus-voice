from rest_framework import serializers
from api.models import Message


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model"""
    sender_info = serializers.SerializerMethodField()
    
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
        """Return anonymized sender info - only show role and name for staff"""
        if obj.sender:
            if obj.is_staff_message:
                return {
                    'role': 'Staff',
                    'name': f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.email
                }
            else:
                return {'role': 'Student', 'name': 'You'}
        return None


class MessageDetailSerializer(MessageSerializer):
    """Detailed serializer with full attachment info"""
    attachment_url = serializers.SerializerMethodField()
    
    class Meta(MessageSerializer.Meta):
        fields = MessageSerializer.Meta.fields + ['attachment_url']

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None
