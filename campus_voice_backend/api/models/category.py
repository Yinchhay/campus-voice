import uuid
from django.db import models


class Category(models.Model):
    
    PRIORITY_CHOICES = [
        ('HIGH', 'High Priority'),
        ('MEDIUM', 'Medium Priority'),
        ('LOW', 'Low Priority'),
    ]

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    priority_level = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='LOW',
        help_text="Default priority level for tickets in this category"
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
    