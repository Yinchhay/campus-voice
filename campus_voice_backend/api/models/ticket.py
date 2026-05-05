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
    category_id = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='tickets')
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
    has_media = models.BooleanField(default=False)
    # Anonymous tracking - displayed on portal
    public_ticket_id = models.CharField(max_length=12, unique=True, editable=False)    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'ticket'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['priority', '-created_at']),
            models.Index(fields=['category_id', '-created_at']),
        ]

    def __str__(self):
        return f"{self.public_ticket_id} - {self.title}"

    def save(self, *args, **kwargs):
        if not self.public_ticket_id:
            # Generate a short public ID (e.g., CV-2024-001234)
            import random
            self.public_ticket_id = f"CV-{random.randint(100000, 999999)}"
        super().save(*args, **kwargs)
    