import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone

from api.models import Ticket, MeetingSlot, StudentMeetingBooking, GoogleCalendarToken
from api.serializers import (
    MeetingSlotSerializer,
    StudentMeetingBookingSerializer,
    StudentMeetingBookingDetailSerializer,
)
from api.services.google_calendar_service import create_calendar_event

logger = logging.getLogger(__name__)


class StudentMeetingSlotsView(APIView):
    """
    GET - Student views available meeting slots for their ticket.
    Only shows non-expired, available slots.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(
                id=ticket_id,
                submitted_by=request.user
            )
        except Ticket.DoesNotExist:
            return Response(
                {'error': 'Ticket not found'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        slots = MeetingSlot.objects.filter(
            ticket=ticket,
            is_available=True,
            start_time__gt=timezone.now()  # Only future slots
        ).select_related('staff_member')
        serializer = MeetingSlotSerializer(slots, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class StudentConfirmMeetingView(APIView):
    """
    POST - Student confirms/books a meeting slot.
    This is the key action — the student picks one of the admin's offered slots.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request, ticket_id, slot_id):
        try:
            ticket = Ticket.objects.get(
                id=ticket_id,
                submitted_by=request.user
            )
        except Ticket.DoesNotExist:
            return Response(
                {'error': 'Ticket not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        # Get the slot and lock it for update (prevent race conditions)
        try:
            slot = MeetingSlot.objects.select_for_update().get(
                id=slot_id,
                ticket=ticket,
                is_available=True
            )
        except MeetingSlot.DoesNotExist:
            return Response(
                {'error': 'Meeting slot not found or already booked'},
                status=status.HTTP_404_NOT_FOUND
            )

        if slot.is_expired():
            return Response(
                {'error': 'This meeting slot has already passed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Check if student already has an active booking for this ticket
        existing_booking = StudentMeetingBooking.objects.filter(
            ticket=ticket,
            student=request.user,
            cancelled_at__isnull=True
        ).exists()
        if existing_booking:
            return Response(
                {'error': 'You already have an active meeting booking for this ticket. '
                          'Cancel it first before booking a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Create the booking
        booking = StudentMeetingBooking.objects.create(
            meeting_slot=slot,
            ticket=ticket,
            student=request.user,
            scheduled_time=slot.start_time,
            is_confirmed=True,
        )
        # Mark the slot as unavailable
        slot.is_available = False
        slot.save(update_fields=['is_available', 'updated_at'])
        # --- Google Calendar sync (if admin has linked) ---
        try:
            google_token = GoogleCalendarToken.objects.get(
                user=slot.staff_member,
                is_active=True
            )
            event_data = create_calendar_event(google_token, slot, booking)
            if event_data:
                slot.google_event_id = event_data['event_id']
                if event_data.get('meet_link') and slot.meeting_type == 'ONLINE':
                    slot.meeting_link = event_data['meet_link']
                slot.save(update_fields=['google_event_id', 'meeting_link', 'updated_at'])
                logger.info(
                    f"Google Calendar event created for "
                    f"{ticket.public_ticket_id} meeting"
                )
        except GoogleCalendarToken.DoesNotExist:
            # Admin hasn't linked Google Calendar — that's perfectly fine
            pass
        except Exception as e:
            logger.error(
                f"Google Calendar sync failed for {ticket.public_ticket_id}: {e}",
                exc_info=True
            )
        logger.info(
            f"Student {request.user.email} confirmed meeting "
            f"for {ticket.public_ticket_id} at {slot.start_time}"
        )
        # TODO: Send notification email to admin about confirmed meeting
        return Response({
            'message': 'Meeting confirmed successfully!',
            'booking': StudentMeetingBookingDetailSerializer(booking).data,
        }, status=status.HTTP_201_CREATED)
class StudentCancelMeetingView(APIView):
    """POST - Student cancels their meeting booking."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    @transaction.atomic
    def post(self, request, ticket_id, booking_id):
        try:
            booking = StudentMeetingBooking.objects.select_related(
                'meeting_slot'
            ).get(
                id=booking_id,
                ticket_id=ticket_id,
                student=request.user,
                cancelled_at__isnull=True
            )
        except StudentMeetingBooking.DoesNotExist:
            return Response(
                {'error': 'Booking not found or already cancelled'},
                status=status.HTTP_404_NOT_FOUND
            )
        # Cancel the booking
        booking.cancelled_at = timezone.now()
        booking.is_confirmed = False
        booking.save(update_fields=['cancelled_at', 'is_confirmed'])
        # Make the slot available again
        slot = booking.meeting_slot
        slot.is_available = True
        # Remove Google Calendar event if it exists
        if slot.google_event_id:
            from api.services.google_calendar_service import delete_calendar_event
            try:
                google_token = GoogleCalendarToken.objects.get(
                    user=slot.staff_member, is_active=True
                )
                delete_calendar_event(google_token, slot.google_event_id)
                slot.google_event_id = None
                slot.meeting_link = None
            except GoogleCalendarToken.DoesNotExist:
                pass
        slot.save(update_fields=[
            'is_available', 'google_event_id', 'meeting_link', 'updated_at'
        ])
        logger.info(
            f"Student {request.user.email} cancelled meeting "
            f"for ticket {ticket_id}"
        )
        return Response(
            {'message': 'Meeting booking cancelled'},
            status=status.HTTP_200_OK
        )

class StudentMyBookingsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        bookings = StudentMeetingBooking.objects.filter(
            student=request.user,
            cancelled_at__isnull=True
        ).select_related(
            'meeting_slot', 'meeting_slot__staff_member', 'ticket'
        ).order_by('-scheduled_time')
        
        serializer = StudentMeetingBookingDetailSerializer(bookings, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
