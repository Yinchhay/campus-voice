from django.db import models
from .permission import Permission

class StaffRole(models.Model):
    name = models.CharField(
        max_length=50,
        help_text="Name e.g., 'View Tickets', 'Approve Tickets'"
    )
    description = models.TextField(
        blank=True,
        help_text="Description of this role's responsibilities"
    )
    permissions = models.ManyToManyField(
        Permission,
        blank=True,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'staff_role'
        ordering = ['name']

    def __str__(self):
        return self.name