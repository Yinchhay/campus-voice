import uuid
from django.db import models
from django.core.validators import FileExtensionValidator
from .ticket import Ticket
from .user import User

class Resolution(models.Model):
    
    ticket = models.OneToOneField(Ticket, on_delete=models.CASCADE, related_name='resolution')
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='resolved_tickets')
    note= models.TextField()
    attachment = models.FileField(
        upload_to='resolutions/%Y/%m/%d/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'])],
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ticket_resolution'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Resolution for {self.ticket.public_ticket_id}"