import uuid
from django.db import models
from .ticket import Ticket
from .user import User


class Message(models.Model):
    
    ticket_id = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages')
    user_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_messages')
    content = models.TextField()
    attachment = models.FileField(upload_to='ticket_attachments/%Y/%m/%d/', null=True, blank=True)
    attachment_name = models.CharField(max_length=255, null=True, blank=True)
    is_staff_message = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'message'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['ticket_id', 'created_at']),
        ]

    def __str__(self):
        sender_role = "Staff" if self.is_staff_message else "Student"
        return f"{sender_role} message in {self.ticket.public_ticket_id}"
