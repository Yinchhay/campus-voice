from rest_framework import serializers
from api.models import TicketAttachment, MessageAttachment, ResolutionAttachment


class TicketAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TicketAttachment
        fields = ['id', 'file', 'original_name', 'uploaded_at']
        read_only_fields = ['id', 'original_name', 'uploaded_at']
        

class MessageAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MessageAttachment
        fields = ['id', 'file', 'original_name', 'uploaded_at']
        read_only_fields = ['id', 'original_name', 'uploaded_at']


class ResolutionAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ResolutionAttachment
        fields = ['id', 'file', 'original_name', 'uploaded_at']
        read_only_fields = ['id', 'original_name', 'uploaded_at']
