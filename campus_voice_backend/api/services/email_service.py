import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.db import models

from api.models import User, UserRole

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
    """
    Send email notification to all admins when a student submits a new ticket.
    """
    
    admin_emails = get_admin_emails()
    if not admin_emails:
        logger.warning("No admin emails found. Skipping new ticket notification.")
        return

    subject = f"[Campus Voice] New Ticket Submitted: {ticket.public_ticket_id}"
    
    context = {
        'ticket': ticket,
        'submitted_by_email': ticket.submitted_by.email if ticket.submitted_by else 'Unknown',
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
            recipient_list=admin_emails,
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(
            f"New ticket notification sent to {len(admin_emails)} admin(s) "
            f"for ticket {ticket.public_ticket_id}"
        )
    except Exception as e:
        logger.error(
            f"Failed to send new ticket notification for "
            f"{ticket.public_ticket_id}: {str(e)}",
            exc_info=True
        )
    

def send_ticket_resolved_notification_to_student(ticket, resolution):
    """
    Send email notification to the student when their ticket is resolved.
    """
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
