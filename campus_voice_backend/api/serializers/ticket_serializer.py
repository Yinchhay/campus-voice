from rest_framework import serializers
from api.models import Ticket, Category, Message
from .message_serializer import PublicMessageSerializer, AdminMessageSerializer


class PublicTicketSerializer(serializers.ModelSerializer):
    """Serializer for Ticket model used for both list and creation"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id',
            'public_ticket_id',
            'category',
            'category_name',
            'title',
            'description',
            'priority',
            'priority_display',
            'status',
            'status_display',
            'resolved_at',
        ]
        read_only_fields = ['id', 'public_ticket_id', 'priority', 'status', 'resolved_at']


class PublicTicketDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for individual ticket view (public/student side)"""
    category = serializers.SerializerMethodField()
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitted_by_email = serializers.CharField(source='submitted_by.email', read_only=True, allow_null=True)
    message_count = serializers.SerializerMethodField()  
    messages = serializers.SerializerMethodField()
    resolution = serializers.SerializerMethodField()
     
    class Meta:
        model = Ticket
        fields = [
            'id',
            'public_ticket_id',
            'category',
            'title',
            'description',
            'priority',
            'priority_display',
            'status',
            'status_display',
            'submitted_by_email',
            'resolution',
            'resolved_at',
            'created_at',
            'updated_at',
            'message_count',
            'messages',
        ]
        read_only_fields = [
            'id', 'public_ticket_id', 'priority', 'status',
            'resolved_at', 'created_at', 'updated_at',
        ]

    def get_category(self, obj):
        return {
            'id': str(obj.category.id),
            'name': obj.category.name,
        }

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_messages(self, obj):
        return PublicMessageSerializer(obj.messages.all(), many=True).data
    
    def get_resolution(self, obj):
        try:
            r = obj.resolution
            return {
                'note':        r.note,
                'attachment':  r.attachment.url if r.attachment else None,
                'resolved_by': r.resolved_by.get_full_name() or r.resolved_by.email if r.resolved_by else None,
                'created_at':  r.created_at,
            }
        except Exception:
            return None


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for Ticket model used for both list and creation (admin)"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id',
            'public_ticket_id',
            'category',
            'category_name',
            'title',
            'description',
            'priority',
            'priority_display',
            'status',
            'status_display',
            'attachment',
            'resolved_at',
        ]
        read_only_fields = ['id', 'public_ticket_id', 'priority']


class TicketDetailSerializer(serializers.ModelSerializer):
    """Full detailed serializer for individual ticket view (admin side)"""
    category = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitted_by_email = serializers.CharField(source='submitted_by.email', read_only=True, allow_null=True)
    messages = serializers.SerializerMethodField()
    resolution = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id',
            'public_ticket_id',
            'category',
            'category_name',
            'title',
            'description',
            'priority',
            'priority_display',
            'status',
            'status_display',
            'attachment',
            'submitted_by_email',
            'resolution',
            'resolved_at',
            'created_at',
            'updated_at',
            'messages',
        ]
        read_only_fields = ['id', 'public_ticket_id', 'priority', 'created_at', 'updated_at']

    def get_category(self, obj):
        return {
            'id': str(obj.category.id),
            'name': obj.category.name,
        }

    def get_messages(self, obj):
        return AdminMessageSerializer(obj.messages.all(), many=True).data

    def get_resolution(self, obj):
        # Bug 2 fix: resolution is a reverse OneToOne, must handle manually
        try:
            r = obj.resolution
            return {
                'note':        r.note,
                'attachment':  r.attachment.url if r.attachment else None,
                'resolved_by': r.resolved_by.get_full_name() or r.resolved_by.email if r.resolved_by else None,
                'created_at':  r.created_at,
                'updated_at':  r.updated_at,
            }
        except Exception:
            return None