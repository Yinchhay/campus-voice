from rest_framework import serializers
from api.models import Ticket, Category, TicketAttachment, ProfanityWord
from .message_serializers import PublicMessageSerializer, AdminMessageSerializer
from .attachment_serializers import TicketAttachmentSerializer, ResolutionAttachmentSerializer
from better_profanity import profanity


class PublicTicketSerializer(serializers.ModelSerializer):
    """Serializer for Ticket model used for both list and creation"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id',
            'public_ticket_id',
            'category',
            'category_name',
            'title',
            'description',
            'is_anonymous',
            'status',
            'status_display',
            'attachments',
            'resolved_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'public_ticket_id',
            'status',
            'resolved_at',
            'created_at',
            'updated_at',
        ]

    def get_attachments(self, obj):
        return TicketAttachmentSerializer(obj.attachments.all(), many=True).data
    
    def create(self, validated_data):
        request = self.context.get('request')
        ticket  = Ticket.objects.create(**validated_data)
        files   = request.FILES.getlist('attachments') if request else []
        for file in files[:3]:
            TicketAttachment.objects.create(
                ticket=ticket,
                file=file,
                uploaded_by=request.user,
            )
        return ticket
    
    def get_profanity_filter(self):
        # Fetch custom words from the database
        custom_words = list(ProfanityWord.objects.values_list('word', flat=True))
        # Add them to the profanity filter alongside the defaults
        profanity.add_censor_words(custom_words)
        return profanity

    def validate_title(self, value):
        pf = self.get_profanity_filter()
        return pf.censor(value)
    
    def validate_description(self, value):
        pf = self.get_profanity_filter()
        return pf.censor(value)


class PublicTicketDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for individual ticket view (public/student side)"""
    category = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitted_by_email = serializers.CharField(source='submitted_by.email', read_only=True, allow_null=True)
    message_count = serializers.SerializerMethodField()  
    messages = serializers.SerializerMethodField()
    resolution = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()
     
    class Meta:
        model = Ticket
        fields = [
            'id',
            'public_ticket_id',
            'category',
            'title',
            'description',
            'is_anonymous',
            'status',
            'status_display',
            'submitted_by_email',
            'attachments',
            'resolution',
            'resolved_at',
            'created_at',
            'updated_at',
            'message_count',
            'messages',
        ]
        read_only_fields = [
            'id', 'public_ticket_id', 'status',
            'resolved_at', 'created_at', 'updated_at',
        ]

    def get_category(self, obj):
        return {
            'id': str(obj.category.id),
            'name': obj.category.name,
        }
        
    def get_attachments(self, obj):
        return TicketAttachmentSerializer(obj.attachments.all(), many=True).data

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_messages(self, obj):
        return PublicMessageSerializer(obj.messages.all(), many=True).data
    
    def get_resolution(self, obj):
        try:
            r = obj.resolution
            return {
                'note':        r.note,
                'attachments': ResolutionAttachmentSerializer(r.attachments.all(), many=True).data,
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
    attachments = serializers.SerializerMethodField()

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
            'attachments',
            'resolved_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'public_ticket_id',
            'priority',
            'created_at',
            'updated_at',
        ]

    def get_attachments(self, obj):
        return TicketAttachmentSerializer(obj.attachments.all(), many=True).data


class TicketDetailSerializer(serializers.ModelSerializer):
    """Full detailed serializer for individual ticket view (admin side)"""
    category = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitted_by_email = serializers.SerializerMethodField()
    messages = serializers.SerializerMethodField()
    resolution = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id',
            'public_ticket_id',
            'category',
            'category_name',
            'title',
            'description',
            'is_anonymous',
            'priority',
            'priority_display',
            'status',
            'status_display',
            'submitted_by_email',
            'attachments',
            'resolution',
            'resolved_at',
            'created_at',
            'updated_at',
            'messages',
        ]
        read_only_fields = ['id', 'public_ticket_id', 'priority', 'created_at', 'updated_at']
        
    def get_submitted_by_email(self, obj):
        """Hide submitter email if ticket is anonymous"""
        if obj.is_anonymous:
            return 'Anonymous'
        return obj.submitted_by.email if obj.submitted_by else None

    def get_category(self, obj):
        return {
            'id': str(obj.category.id),
            'name': obj.category.name,
        }
        
    def get_attachments(self, obj):
        return TicketAttachmentSerializer(obj.attachments.all(), many=True).data

    def get_messages(self, obj):
        return AdminMessageSerializer(obj.messages.all(), many=True).data

    def get_resolution(self, obj):
        # Bug 2 fix: resolution is a reverse OneToOne, must handle manually
        try:
            r = obj.resolution
            return {
                'note':        r.note,
                'attachments': ResolutionAttachmentSerializer(r.attachments.all(), many=True).data,
                'resolved_by': r.resolved_by.get_full_name() or r.resolved_by.email if r.resolved_by else None,
                'created_at':  r.created_at,
                'updated_at':  r.updated_at,
            }
        except Exception:
            return None
