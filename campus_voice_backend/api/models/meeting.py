import uuid
from django.db import models
from django.utils import timezone
from .ticket import Ticket
from .user import User


class MeetingSlot(models.Model):
    """
    Meeting slot offered by OSS staff for high-priority ticket follow-ups.
    """
    class MeetingType(models.TextChoices):
        IN_PERSON = 'IN_PERSON', 'In Person Meeting'
        ONLINE = 'ONLINE', 'Online Meeting'
    

    class Campus(models.TextChoices):
        MAIN = 'MAIN', 'Main Campus'
        EAS = 'EAS', 'EAS Campus'
        
    
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='meeting_slots')
    staff_member = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='offered_meeting_slots')
    google_event_id = models.CharField(max_length=255, null=True, blank=True)
    
    # Meeting details
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    meeting_type = models.CharField(
        max_length=20,
        choices=MeetingType.choices,
        default=MeetingType.ONLINE
    )
    campus_location = models.CharField(
        max_length=20,
        choices=Campus.choices,
        default=Campus.MAIN
    )
    room_number = models.CharField(max_length=10, null=True, blank=True)
    location_or_details = models.TextField(null=True, blank=True)
    is_available = models.BooleanField(default=True)
    meeting_link = models.URLField(null=True, blank=True) # Meeting link for Online meetings
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meeting_slot'
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['ticket', 'start_time']),
            # models.Index(fields=['staff_member', 'start_time']),
        ]

    def __str__(self):
        return f"Meeting slot for {self.ticket.public_ticket_id} - {self.start_time}"

    def is_expired(self):
        return self.start_time < timezone.now()


class StudentMeetingBooking(models.Model):
    """
    Records student's booking of a meeting slot while maintaining anonymity.
    """
    meeting_slot = models.OneToOneField(
        MeetingSlot,
        on_delete=models.CASCADE,
        related_name='student_booking'
    )
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='meeting_bookings')
    student = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='meeting_bookings')
    
    # Meeting details
    scheduled_time = models.DateTimeField()
    is_confirmed = models.BooleanField(default=False)
    meeting_completed = models.BooleanField(default=False)
    completion_notes = models.TextField(null=True, blank=True)
    # Timestamps
    booked_at = models.DateTimeField(auto_now_add=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'student_meeting_booking'
        ordering = ['-scheduled_time']

    def __str__(self):
        return f"Booking for {self.ticket.public_ticket_id} - {self.scheduled_time}"
