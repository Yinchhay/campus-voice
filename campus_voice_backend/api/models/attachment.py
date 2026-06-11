from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from .user import User

ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']

def ticket_upload_path(instance, filename):
    return f'tickets/{instance.ticket.id}/{filename}'

def message_upload_path(instance, filename):
    return f'messages/{instance.message.id}/{filename}'

def resolution_upload_path(instance, filename):
    return f'resolutions/{instance.resolution.id}/{filename}'

class BaseAttachment(models.Model):
    """Shared fields for all attachment type"""
    file = models.FileField(
        validators=[FileExtensionValidator(allowed_extensions=ALLOWED_EXTENSIONS)]
    )
    original_name = models.CharField(max_length=255, blank=True)
    uploaded_by   = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        abstract = True
        
    def save(self, *args, **kwargs):
        # store the original filename before Django renames it
        if self.file and not self.original_name:
            self.original_name = self.file.name.split('/')[-1]
        super().save(*args, **kwargs)


class TicketAttachment(BaseAttachment):
    MAX_FILES = 3
    
    ticket = models.ForeignKey(
        'Ticket',
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(
        upload_to=ticket_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=ALLOWED_EXTENSIONS)]
    )
    
    class Meta:
        db_table  = 'ticket_attachment'
        ordering  = ['-uploaded_at']

    def clean(self):
        if self.pk is None:  # only check on new uploads
            count = TicketAttachment.objects.filter(ticket=self.ticket).count()
            if count >= self.MAX_FILES:
                raise ValidationError(
                    f'A ticket can have at most {self.MAX_FILES} attachments.'
                )

    def __str__(self):
        return f'Attachment for {self.ticket.public_ticket_id}'

class MessageAttachment(BaseAttachment):
    MAX_FILES = 1

    message = models.OneToOneField(   # OneToOne enforces the 1-file limit at DB level
        'Message',
        on_delete=models.CASCADE,
        related_name='attachment'
    )
    file = models.FileField(
        upload_to=message_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=ALLOWED_EXTENSIONS)]
    )

    class Meta:
        db_table = 'message_attachment'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'Attachment for message {self.message.id}'


class ResolutionAttachment(BaseAttachment):
    MAX_FILES = 3

    resolution = models.ForeignKey(
        'Resolution',
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(
        upload_to=resolution_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=ALLOWED_EXTENSIONS)]
    )

    class Meta:
        db_table = 'resolution_attachment'
        ordering = ['-uploaded_at']

    def clean(self):
        if self.pk is None:
            count = ResolutionAttachment.objects.filter(
                resolution=self.resolution
            ).count()
            if count >= self.MAX_FILES:
                raise ValidationError(
                    f'A resolution can have at most {self.MAX_FILES} attachments.'
                )

    def __str__(self):
        return f'Attachment for resolution {self.resolution.id}'