import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.db import models

from api.models import User, UserRole, EmailSetting

logger = logging.getLogger(__name__)

def get_admin_emails():
    """
    Get email addresses of all users who have any admin role assigned.
    """
    admin_user_ids = UserRole.objects.values_list('user_id', flat=True).distinct()
    admin_emails = list(
        User.objects.filter(
            models.Q(id__in=admin_user_ids) |
            models.Q(role__in=[User.Role.ADMIN, User.Role.STAFF])
        )
        .filter(is_active=True)
        .values_list('email', flat=True)
        .distinct()
    )
    return admin_emails

def send_new_ticket_notification_to_admin(ticket):
    
    email_setting = EmailSetting.get_setting()
    recipient_email = getattr(settings, 'EMAIL_HOST_USER', None)
    
    if email_setting and email_setting.ticket_notification_email:
        recipient_email = email_setting.ticket_notification_email
        
    if not recipient_email:
        logger.warning("No designated admin email configured (and no default). Skipping new ticket notification.")
        return

    subject = f"[Campus Voice] New Ticket Submitted: {ticket.public_ticket_id}"
    
    # Respect anonymity
    if ticket.is_anonymous:
        submitted_by_display = 'Anonymous Student'
    else:
        submitted_by_display = ticket.submitted_by.email if ticket.submitted_by else 'Unknown'

    context = {
        'ticket': ticket,
        'submitted_by_email': submitted_by_display,
        'description_preview': (
            ticket.description[:500] + '...'
            if len(ticket.description) > 500
            else ticket.description
        ),
    }
    
    html_message = render_to_string('emails/new_ticket_admin.html', context)
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(
            f"New ticket notification sent to {recipient_email} admin(s) "
            f"for ticket {ticket.public_ticket_id}"
        )
    except Exception as e:
        logger.error(
            f"Failed to send new ticket notification for "
            f"{ticket.public_ticket_id}: {str(e)}",
            exc_info=True
        )
    

def send_ticket_resolved_notification_to_student(ticket, resolution):

    if not ticket.submitted_by:
        logger.warning(
            f"Ticket {ticket.public_ticket_id} has no submitted_by user. "
            f"Skipping resolution notification."
        )
        return
    
    student_email = ticket.submitted_by.email
    student_name = (
        ticket.submitted_by.get_full_name()
        or ticket.submitted_by.username
        or student_email
    )
    
    subject = f"[Campus Voice] Your Ticket {ticket.public_ticket_id} Has Been Resolved"
    resolved_by_name = 'Admin'
    
    if resolution.resolved_by:
        resolved_by_name = (
            resolution.resolved_by.get_full_name()
            or resolution.resolved_by.email
        )
        
    context = {
        'ticket': ticket,
        'resolution': resolution,
        'student_name': student_name,
        'resolved_by_name': resolved_by_name,
    }
    
    html_message = render_to_string('emails/ticket_resolved_student.html', context)
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[student_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(
            f"Resolution notification sent to {student_email} "
            f"for ticket {ticket.public_ticket_id}"
        )
    except Exception as e:
        logger.error(
            f"Failed to send resolution notification to {student_email} "
            f"for ticket {ticket.public_ticket_id}: {str(e)}",
            exc_info=True
        )

def send_new_meeting_booking_notification_to_admin(booking):

    email_setting = EmailSetting.get_setting()
    recipient_email = getattr(settings, 'EMAIL_HOST_USER', None)
    
    if email_setting and email_setting.ticket_notification_email:
        recipient_email = email_setting.ticket_notification_email
        
    if not recipient_email:
        logger.warning("No designated admin email configured (and no default). Skipping new meeting notification.")
        return

    ticket = booking.ticket
    slot = booking.meeting_slot
    
    subject = f"[Campus Voice] New Meeting Booked for Ticket: {ticket.public_ticket_id}"
    
    if booking.student:
        student_display = booking.student.get_full_name() or booking.student.email
    else:
        student_display = 'Anonymous Student'
        
    context = {
        'ticket': ticket,
        'booking': booking,
        'slot': slot,
        'student_name': student_display,
    }
    
    html_message = render_to_string('emails/new_meeting_admin.html', context)
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(
            f"New meeting notification sent to {recipient_email} admin(s) "
            f"for ticket {ticket.public_ticket_id}"
        )
    except Exception as e:
        logger.error(
            f"Failed to send new meeting notification for "
            f"{ticket.public_ticket_id}: {str(e)}",
            exc_info=True
        )

