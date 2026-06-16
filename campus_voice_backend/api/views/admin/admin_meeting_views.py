import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.permissions import HasResourcePermission
from django.db import transaction
from django.utils import timezone

from api.utils import get_admin_ticket
from api.models import MeetingSlot, StudentMeetingBooking, GoogleCalendarToken
from api.serializers import (
    MeetingSlotSerializer,
    MeetingSlotDetailSerializer,
    StudentMeetingBookingSerializer,
)
from api.services.google_calendar_service import (
    get_authorization_url,
    exchange_code_for_tokens,
    create_calendar_event,
    delete_calendar_event,
)

logger = logging.getLogger(__name__)

class AdminMeetingSlotListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'meeting'
    
    """
    GET  - List all meeting slots for a ticket
    POST - Create one or multiple meeting slots for a ticket
    """
    
    def get(self, request, ticket_id):
        ticket, error = get_admin_ticket(ticket_id)
        if error:
            return error
        
        slots = MeetingSlot.objects.filter(ticket=ticket).select_related('staff_member').prefetch_related('student_booking')
        serializer = MeetingSlotDetailSerializer(slots, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    
    @transaction.atomic
    def post(self, request, ticket_id):
        """
        Create meeting slot(s). Supports both single and bulk creation.
        
        Single:
        {
            "start_time": "2026-06-15T10:00:00+07:00",
            "end_time": "2026-06-15T10:30:00+07:00",
            "meeting_type": "ONLINE",
            "campus_location": "MAIN",
            "room_number": "A301",
            "location_or_details": "Building A, 3rd Floor"
        }
        
        Bulk:
        {
            "slots": [
                {"start_time": "...", "end_time": "...", ...},
                {"start_time": "...", "end_time": "...", ...}
            ]
        }
        """
        ticket, error = get_admin_ticket(ticket_id)
        if error:
            return error
        
        # Support bulk creation
        slots_data = request.data.get('slots', [request.data])
        created_slots = []
        errors = []
        
        for i, slot_data in enumerate(slots_data):
            serializer = MeetingSlotSerializer(data=slot_data)
            if serializer.is_valid():
                slot = serializer.save(
                    ticket=ticket,
                    staff_member=request.user,
                )
                created_slots.append(slot)
                logger.info(
                    f"Meeting slot created for {ticket.public_ticket_id} "
                    f"by {request.user.email} at {slot.start_time}"
                )
            else:
                errors.append({f'slot_{i}': serializer.errors})
                
        if errors and not created_slots:
            return Response(
                {'errors': errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        response_data = {
            'message': f'{len(created_slots)} meeting slot(s) created',
            'slots': MeetingSlotSerializer(created_slots, many=True).data,
        }
        if errors:
            response_data['partial_errors'] = errors

        return Response(response_data, status=status.HTTP_201_CREATED)

class AdminMeetingSlotDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'meeting'

    def get(self, request, ticket_id, slot_id):
        ticket, error = get_admin_ticket(ticket_id)
        if error:
            return error
        
        try:
            slot = MeetingSlot.objects.select_related(
                'staff_member'
            ).get(id=slot_id, ticket=ticket)
        except MeetingSlot.DoesNotExist:
            return Response(
                {'error': 'Meeting slot not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = MeetingSlotDetailSerializer(slot)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def patch(self, request, ticket_id, slot_id):
        ticket, error = get_admin_ticket(ticket_id)
        if error:
            return error
        try:
            slot = MeetingSlot.objects.get(id=slot_id, ticket=ticket)
        except MeetingSlot.DoesNotExist:
            return Response(
                {'error': 'Meeting slot not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        # Don't allow editing a slot that's already booked
        if hasattr(slot, 'student_booking') and slot.student_booking:
            return Response(
                {'error': 'Cannot edit a slot that has been booked by a student'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = MeetingSlotSerializer(slot, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(
                f"Meeting slot {slot_id} updated for {ticket.public_ticket_id}"
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @transaction.atomic
    def delete(self, request, ticket_id, slot_id):
        ticket, error = get_admin_ticket(ticket_id)
        if error:
            return error
        try:
            slot = MeetingSlot.objects.get(id=slot_id, ticket=ticket)
        except MeetingSlot.DoesNotExist:
            return Response(
                {'error': 'Meeting slot not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        # If synced to Google Calendar, remove the event
        if slot.google_event_id:
            try:
                google_token = GoogleCalendarToken.objects.get(
                    user=request.user, is_active=True
                )
                delete_calendar_event(google_token, slot.google_event_id)
            except GoogleCalendarToken.DoesNotExist:
                pass
        slot.delete()
        logger.info(
            f"Meeting slot {slot_id} deleted for {ticket.public_ticket_id}"
        )
        return Response(
            {'message': 'Meeting slot deleted'},
            status=status.HTTP_200_OK
        )
        
        
class AdminBookingListView(APIView):
    """List all bookings across all tickets for the logged-in admin."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'meeting'
    
    def get(self, request):
        bookings = StudentMeetingBooking.objects.filter(
            meeting_slot__staff_member=request.user
        ).select_related(
            'meeting_slot', 'ticket', 'student'
        ).order_by('-booked_at')
        
        serializer = StudentMeetingBookingSerializer(bookings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminMarkMeetingCompleteView(APIView):
    """Admin marks a meeting as completed with optional notes."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'meeting'
    
    @transaction.atomic
    def patch(self, request, ticket_id, booking_id):
        ticket, error = get_admin_ticket(ticket_id)
        if error:
            return error
        try:
            booking = StudentMeetingBooking.objects.get(
                id=booking_id, ticket=ticket
            )
        except StudentMeetingBooking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        if not booking.is_confirmed:
            return Response(
                {'error': 'Cannot complete a booking that is not confirmed'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        booking.meeting_completed = True
        booking.completion_notes = request.data.get('completion_notes', '')
        booking.save(update_fields=['meeting_completed', 'completion_notes'])
        logger.info(
            f"Meeting for {ticket.public_ticket_id} marked as completed"
        )
        return Response(
            StudentMeetingBookingSerializer(booking).data,
            status=status.HTTP_200_OK
        )    


class GoogleCalendarConnectView(APIView):
    """
    Admin clicks this to start linking their Google Calendar.
    Returns the Google OAuth URL to redirect to.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'meeting'
    
    def get(self, request):
        auth_url, state = get_authorization_url()
        # Store state in session for CSRF verification on callback
        request.session['google_oauth_state'] = state
        return Response({
            'authorization_url': auth_url,
            'message': 'Redirect the admin to this URL to link their Google Calendar'
        })


class GoogleCalendarCallbackView(APIView):
    """
    Google redirects here after admin grants calendar permission.
    Exchange the code for tokens and store them.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'meeting'
    
    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response(
                {'error': 'Authorization code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            tokens = exchange_code_for_tokens(code)
        except Exception as e:
            logger.error(f"Google OAuth token exchange failed: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to exchange authorization code'},
                status=status.HTTP_400_BAD_REQUEST
            )
        GoogleCalendarToken.objects.update_or_create(
            user=request.user,
            defaults={
                'access_token': tokens['access_token'],
                'refresh_token': tokens['refresh_token'],
                'token_expiry': tokens['token_expiry'],
                'calendar_email': request.user.email,
                'is_active': True,
            }
        )
        logger.info(f"Google Calendar connected for {request.user.email}")
        return Response({
            'message': 'Google Calendar connected successfully!'
        })
        

class GoogleCalendarStatusView(APIView):
    """Check if the admin has Google Calendar linked."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'meeting'
    
    def get(self, request):
        try:
            token = GoogleCalendarToken.objects.get(
                user=request.user, is_active=True
            )
            return Response({
                'connected': True,
                'calendar_email': token.calendar_email,
                'connected_at': token.created_at,
            })
        except GoogleCalendarToken.DoesNotExist:
            return Response({'connected': False})
        
    def delete(self, request):
        """Disconnect Google Calendar."""
        deleted, _ = GoogleCalendarToken.objects.filter(
            user=request.user
        ).delete()
        return Response({
            'message': 'Google Calendar disconnected' if deleted else 'No connection found'
        })
        