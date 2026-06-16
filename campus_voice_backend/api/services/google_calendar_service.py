import logging
from datetime import datetime

import requests
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from django.conf import settings
from django.utils import timezone

from api.models import GoogleCalendarToken

logger = logging.getLogger(__name__)

SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar.events',
]


def get_google_oauth_flow():
    """Create OAuth flow using your Google Cloud Console credentials."""
    return Flow.from_client_config(
        client_config={
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=settings.GOOGLE_CALENDAR_REDIRECT_URI
    )


def get_authorization_url():
    """
    Generate the URL admins click to link their Google Calendar.
    Each admin consents individually — no IT department needed.
    """
    flow = get_google_oauth_flow()
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='false',
        prompt='consent'
    )
    return authorization_url, state


def exchange_code_for_tokens(authorization_code):
    """Exchange the OAuth callback code for access/refresh tokens."""
    flow = get_google_oauth_flow()
    flow.fetch_token(code=authorization_code)
    credentials = flow.credentials
    calendar_email = get_google_account_email(credentials.token)
    return {
        'access_token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_expiry': credentials.expiry,
        'calendar_email': calendar_email,
    }


def get_google_account_email(access_token):
    """Fetch the email of the Google account that granted Calendar access."""
    response = requests.get(
        'https://openidconnect.googleapis.com/v1/userinfo',
        headers={'Authorization': f'Bearer {access_token}'},
        timeout=10,
    )
    response.raise_for_status()
    return response.json().get('email', '')


def _get_credentials(google_token):
    """Build Credentials object from stored token, with auto-refresh."""
    credentials = Credentials(
        token=google_token.access_token,
        refresh_token=google_token.refresh_token,
        token_uri='https://oauth2.googleapis.com/token',
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=SCOPES,
    )
    # Auto-refresh if expired
    if credentials.expired and credentials.refresh_token:
        from google.auth.transport.requests import Request
        credentials.refresh(Request())
        # Save the refreshed token
        google_token.access_token = credentials.token
        google_token.token_expiry = credentials.expiry
        google_token.save(update_fields=['access_token', 'token_expiry', 'updated_at'])
        logger.info(f"Refreshed Google token for {google_token.user.email}")
    return credentials


def _get_calendar_service(google_token):
    """Build a Google Calendar API service client."""
    credentials = _get_credentials(google_token)
    return build(
        'calendar',
        'v3',
        credentials=credentials,
        cache_discovery=False,
        static_discovery=True,
    )


def create_calendar_event(google_token, meeting_slot, student_booking):
    """
    Create a Google Calendar event when a student confirms a meeting.
    Returns event_id and meet_link.
    """
    try:
        service = _get_calendar_service(google_token)
        # Build attendee list
        attendees = []
        if student_booking.student and student_booking.student.email:
            attendees.append({'email': student_booking.student.email})
        event_body = {
            'summary': f'Campus Voice Meeting - {meeting_slot.ticket.public_ticket_id}',
            'description': (
                f'Ticket: {meeting_slot.ticket.public_ticket_id}\n'
                f'Title: {meeting_slot.ticket.title}\n'
                f'Type: {meeting_slot.get_meeting_type_display()}\n'
            ),
            'start': {
                'dateTime': meeting_slot.start_time.isoformat(),
                'timeZone': 'Asia/Phnom_Penh',
            },
            'end': {
                'dateTime': meeting_slot.end_time.isoformat(),
                'timeZone': 'Asia/Phnom_Penh',
            },
            'attendees': attendees,
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 30},
                    {'method': 'email', 'minutes': 60},
                ],
            },
        }
        # Add Google Meet link for online meetings
        if meeting_slot.meeting_type == 'ONLINE':
            event_body['conferenceData'] = {
                'createRequest': {
                    'requestId': f'cv-meeting-{meeting_slot.id}',
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'},
                }
            }
        # Add location for in-person meetings
        if meeting_slot.meeting_type == 'IN_PERSON':
            location_parts = [meeting_slot.get_campus_location_display()]
            if meeting_slot.room_number:
                location_parts.append(f'Room {meeting_slot.room_number}')
            if meeting_slot.location_or_details:
                location_parts.append(meeting_slot.location_or_details)
            event_body['location'] = ', '.join(location_parts)
        created_event = service.events().insert(
            calendarId='primary',
            body=event_body,
            conferenceDataVersion=1,
            sendUpdates='all',  # Sends invite emails to attendees
        ).execute()
        logger.info(
            f"Created Google Calendar event {created_event['id']} "
            f"for ticket {meeting_slot.ticket.public_ticket_id}"
        )
        return {
            'event_id': created_event['id'],
            'meet_link': created_event.get('hangoutLink', ''),
            'html_link': created_event.get('htmlLink', ''),
        }
    except Exception as e:
        logger.error(f"Failed to create Google Calendar event: {e}", exc_info=True)
        return None

def delete_calendar_event(google_token, event_id):
    """Remove a calendar event when a meeting is cancelled."""
    try:
        service = _get_calendar_service(google_token)
        service.events().delete(
            calendarId='primary',
            eventId=event_id,
            sendUpdates='all',
        ).execute()
        logger.info(f"Deleted Google Calendar event {event_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete Google Calendar event: {e}", exc_info=True)
        return False
