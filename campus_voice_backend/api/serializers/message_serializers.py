from rest_framework import serializers
from api.models import Message, MessageAttachment
from .attachment_serializers import MessageAttachmentSerializer

class PublicMessageSerializer(serializers.ModelSerializer):
    """
    Student-facing serializer.
    - sender_info returns name + avatar + role for chat bubble display
    - is_staff_message read directly from model field (set by the view)
    - no FK IDs exposed
    """
    sender_info = serializers.SerializerMethodField()
    attachment = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id',
            'sender',
            'content',
            'attachment',
            'is_staff_message',
            'created_at',
            'sender_info',
        ]
        read_only_fields = ['id', 'sender', 'sender_info', 'is_staff_message', 'created_at']

    def get_sender_info(self, obj):
        if obj.sender:
            return {
                'name': obj.sender.get_full_name(),
                'avatar': obj.sender.google_picture_url or None,
                'role': obj.sender.role,  # 'STUDENT' | 'STAFF' | 'ADMIN'
            }
        return None
    
    def get_attachment(self, obj):
        try:
            return MessageAttachmentSerializer(obj.attachment).data
        except MessageAttachment.DoesNotExist:
            return None
    
    def create(self, validated_data):
        request = self.context.get('request')
        message = Message.objects.create(**validated_data)
        if request and request.FILES.get('attachment'):
            MessageAttachment.objects.create(
                message=message,
                file=request.FILES['attachment'],
                uploaded_by=request.user,
            )
        return message


class AdminMessageSerializer(serializers.ModelSerializer):
    """
    Staff-facing serializer.
    - sender_info returns full details: name, email, avatar, role
    - includes updated_at for audit trail
    """
    sender_info = serializers.SerializerMethodField()
    attachment = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id',
            'sender',
            'content',
            'attachment',
            'is_staff_message',
            'created_at',
            'updated_at',
            'sender_info',
        ]
        read_only_fields = ['id', 'sender', 'sender_info', 'is_staff_message', 'created_at', 'updated_at']

    def get_sender_info(self, obj):
        if obj.sender:
            return {
                'id':     str(obj.sender.id),
                'name':   obj.sender.get_full_name() or obj.sender.email,
                'email':  obj.sender.email,
                'avatar': obj.sender.google_picture_url or None,
                'role':   obj.sender.role,   # 'STUDENT' | 'STAFF' | 'ADMIN'
            }
        return None
    
    def get_attachment(self, obj):
        try:
            return MessageAttachmentSerializer(obj.attachment).data
        except MessageAttachment.DoesNotExist:
            return None
        
    def create(self, validated_data):
        request = self.context.get('request')
        message = Message.objects.create(**validated_data)
        if request and request.FILES.get('attachment'):
            MessageAttachment.objects.create(
                message=message,
                file=request.FILES['attachment'],
                uploaded_by=request.user,
            )
        return message
    