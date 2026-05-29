from django.db import models

class Permission(models.Model):
    class Action(models.TextChoices):
        VIEW = 'view', 'View'
        CREATE = 'create', 'Create'
        UPDATE = 'update', 'Update'
        DELETE = 'delete', 'Delete'
        EXPORT = 'export', 'Export'
    
    name = models.CharField(
        max_length=50,
        help_text="Name e.g., 'View Tickets', 'Approve Tickets'"
    )
    resource = models.CharField(
        max_length=50,
        help_text="e.g., 'tickets', 'users', 'categories'"
    )
    action = models.CharField(
        max_length=20, 
        choice=Action.choices,
        help_text="Action type (view, create, update, delete, export)" 
    )
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'admin_permission'
        unique_together = ['resource', 'action']
        ordering = ['resource', 'action']
        verbose_name = 'Permission'
        verbose_name_plural = 'Permissions' 

    def __str__(self):
        return f"{self.resource}.{self.action}"