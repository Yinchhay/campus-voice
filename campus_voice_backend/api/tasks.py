import logging
from celery import shared_task

from api.services.email_service import (
    send_new_ticket_notification_to_admin,
    send_ticket_resolved_notification_to_student,
    send_new_meeting_booking_notification_to_admin,
)

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_new_ticket_notification_task(self, ticket_id):
    """Send new ticket notification email to admin in the background."""
    try:
        from api.models import Ticket
        ticket = Ticket.objects.get(id=ticket_id)
        send_new_ticket_notification_to_admin(ticket)
        logger.info(f"[Celery] Sent new ticket notification for ticket {ticket.public_ticket_id}")
    except Exception as exc:
        logger.error(f"[Celery] Failed to send ticket notification for ticket_id={ticket_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_ticket_resolved_notification_task(self, ticket_id, resolution_id):
    """Send ticket resolved notification email to student in the background."""
    try:
        from api.models import Ticket, Resolution
        ticket = Ticket.objects.get(id=ticket_id)
        resolution = Resolution.objects.get(id=resolution_id)
        send_ticket_resolved_notification_to_student(ticket, resolution)
        logger.info(f"[Celery] Sent resolved notification for ticket {ticket.public_ticket_id}")
    except Exception as exc:
        logger.error(f"[Celery] Failed to send resolved notification for ticket_id={ticket_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_meeting_booking_notification_task(self, booking_id):
    """Send meeting booking notification email to admin in the background."""
    try:
        from api.models import StudentMeetingBooking
        booking = StudentMeetingBooking.objects.get(id=booking_id)
        send_new_meeting_booking_notification_to_admin(booking)
        logger.info(f"[Celery] Sent meeting booking notification for booking {booking_id}")
    except Exception as exc:
        logger.error(f"[Celery] Failed to send meeting notification for booking_id={booking_id}: {exc}")
        raise self.retry(exc=exc)
