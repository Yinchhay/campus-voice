from rest_framework import serializers
from api.models import MeetingSlot, StudentMeetingBooking


class MeetingSlotSerializer(serializers.ModelSerializer):
    """Serializer for MeetingSlot model"""
    staff_name = serializers.CharField(source='staff_member.get_full_name', read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    is_expired_status = serializers.SerializerMethodField()
    
    class Meta:
        model = MeetingSlot
        fields = [
            'id',
            'ticket',
            'staff_member',
            'staff_name',
            'start_time',
            'end_time',
            'duration_minutes',
            'meeting_type',
            'location_or_details',
            'is_available',
            'meeting_link',
            'is_expired_status',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_duration_minutes(self, obj):
        """Calculate duration in minutes"""
        delta = obj.end_time - obj.start_time
        return int(delta.total_seconds() / 60)

    def get_is_expired_status(self, obj):
        """Check if meeting slot is expired"""
        return obj.is_expired()


class MeetingSlotDetailSerializer(MeetingSlotSerializer):
    """Detailed serializer for individual meeting slot"""
    student_booking = serializers.SerializerMethodField()
    
    class Meta(MeetingSlotSerializer.Meta):
        fields = MeetingSlotSerializer.Meta.fields + ['student_booking']

    def get_student_booking(self, obj):
        """Get student booking info if exists"""
        booking = obj.student_booking if hasattr(obj, 'student_booking') else None
        if booking:
            return StudentMeetingBookingSerializer(booking).data
        return None


class StudentMeetingBookingSerializer(serializers.ModelSerializer):
    """Serializer for StudentMeetingBooking model"""
    meeting_details = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentMeetingBooking
        fields = [
            'id',
            'meeting_slot',
            'ticket',
            'scheduled_time',
            'is_confirmed',
            'meeting_completed',
            'completion_notes',
            'meeting_details',
            'booked_at',
            'cancelled_at'
        ]
        read_only_fields = ['id', 'booked_at', 'cancelled_at']

    def get_meeting_details(self, obj):
        """Return meeting slot details in compact form"""
        slot = obj.meeting_slot
        return {
            'id': str(slot.id),
            'start_time': slot.start_time,
            'end_time': slot.end_time,
            'meeting_type': slot.get_meeting_type_display(),
            'location_or_details': slot.location_or_details,
            'meeting_link': slot.meeting_link,
            'staff_name': f"{slot.staff_member.first_name} {slot.staff_member.last_name}".strip()
        }


class StudentMeetingBookingDetailSerializer(StudentMeetingBookingSerializer):
    """Detailed serializer with full meeting slot info"""
    meeting_slot_detail = MeetingSlotDetailSerializer(source='meeting_slot', read_only=True)
    
    class Meta(StudentMeetingBookingSerializer.Meta):
        fields = StudentMeetingBookingSerializer.Meta.fields + ['meeting_slot_detail']
