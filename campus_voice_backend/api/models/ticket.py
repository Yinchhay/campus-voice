import uuid
from django.db import models
from django.core.validators import FileExtensionValidator
from .category import Category
from .user import User


class Ticket(models.Model):
    
    class Status(models.TextChoices):
        SUBMITTED = 'SUBMITTED', 'Submitted'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        RESOLVED = 'RESOLVED', 'Resolved'

    class Priority(models.TextChoices):
        HIGH = 'HIGH', 'High Priority'
        MEDIUM = 'MEDIUM', 'Medium Priority'
        LOW = 'LOW', 'Low Priority'
        

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='tickets')
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_tickets')
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.LOW
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED
    )

    public_ticket_id = models.CharField(max_length=20, unique=True, editable=False)
    author_hash = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    is_anonymous = models.BooleanField(default=False, help_text="If True, submitter identity is hidden from admins")
    resolved_at = models.DateTimeField(null=True, blank=True)
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ticket'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['priority', '-created_at']),
            models.Index(fields=['category', '-created_at']),
        ]

    def __str__(self):
        return f"{self.public_ticket_id} - {self.title}"

    def save(self, *args, **kwargs):
        if not self.public_ticket_id:
            from django.utils import timezone
            year = timezone.now().year
            # Count existing tickets for this year and increment
            last_ticket = (
                Ticket.objects
                .filter(public_ticket_id__startswith=f"CV-{year}-")
                .order_by('-public_ticket_id')
                .values_list('public_ticket_id', flat=True)
                .first()
            )
            if last_ticket:
                last_number = int(last_ticket.split('-')[-1])
                next_number = last_number + 1
            else:
                next_number = 1
            self.public_ticket_id = f"CV-{year}-{next_number:06d}"
        super().save(*args, **kwargs)