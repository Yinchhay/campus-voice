import uuid
from django.db import models
from .ticket import Ticket
from .user import User


class Message(models.Model):
    
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_messages')
    content = models.TextField()
    attachment = models.FileField(upload_to='ticket_attachments/%Y/%m/%d/', null=True, blank=True)
    is_staff_message = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'message'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['ticket', 'created_at']),
        ]

    def __str__(self):
        return f"Message by {self.sender} on Ticket #{self.ticket.id}"
