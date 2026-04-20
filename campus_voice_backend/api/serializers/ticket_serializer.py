from rest_framework import serializers
from api.models import Ticket, Category


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for Ticket model - used for both list and creation"""
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
            'has_media',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'public_ticket_id', 'priority', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Create ticket and assign priority based on category"""
        ticket = Ticket.objects.create(**validated_data)
        # Priority is automatically assigned from category
        ticket.priority = ticket.category.priority_level
        ticket.save()
        return ticket


class TicketDetailSerializer(TicketSerializer):
    """Detailed serializer for individual ticket view"""
    category = serializers.SerializerMethodField()
    submitted_by_email = serializers.CharField(source='submitted_by.email', read_only=True, allow_null=True)
    assigned_to_info = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    
    class Meta(TicketSerializer.Meta):
        fields = TicketSerializer.Meta.fields + [
            'submitted_by_email',
            'assigned_to',
            'assigned_to_info',
            'message_count',
            'resolved_at'
        ]

    def get_category(self, obj):
        return {
            'id': str(obj.category.id),
            'name': obj.category.name
        }

    def get_assigned_to_info(self, obj):
        if obj.assigned_to:
            return {
                'id': str(obj.assigned_to.id),
                'email': obj.assigned_to.email,
                'name': f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip()
            }
        return None

    def get_message_count(self, obj):
        return obj.messages.count()


class TicketStaffSerializer(TicketDetailSerializer):
    """Serializer for staff dashboard - includes all details"""
    class Meta(TicketDetailSerializer.Meta):
        fields = TicketDetailSerializer.Meta.fields + []
