import uuid
from django.db import models


class Category(models.Model):
    
    class IssueType(models.TextChoices):
        SERVICE = 'SERVICE', 'Service Issue'
        ACADEMIC = 'ACADEMIC', 'Academic Issue'
    
    class Priority(models.TextChoices):
        HIGH = 'HIGH', 'High Priority'
        MEDIUM = 'MEDIUM', 'Medium Priority'
        LOW = 'LOW', 'Low Priority'


    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    issue_type = models.CharField(max_length=20, choices=IssueType.choices, default=IssueType.SERVICE)
    priority_level = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.LOW
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'category'
        verbose_name_plural = 'Categories'
        ordering = ['-created_at']

    def __str__(self):
        return self.name
    