from django.db import models

class Permission(models.Model):
    class Action(models.TextChoices):
        VIEW = 'view', 'View'
        CREATE = 'create', 'Create'
        UPDATE = 'update', 'Update'
        DELETE = 'delete', 'Delete'
        EXPORT = 'export', 'Export'
    
    resource = models.CharField(
        max_length=50,
        help_text="e.g., 'tickets', 'users', 'categories'"
    )
    action = models.CharField(
        max_length=20, 
        choices=Action.choices,
        help_text="Action type (view, create, update, delete, export)" 
    )
    description = models.TextField(
        max_length=250,
        blank=True,
        help_text="Description of the permission"
    )
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
    
    @property
    def codename(self):
        return f"{self.resource}.{self.action}"
    
    @classmethod
    def get_by_codename(cls, codename: str):
        try:
            resource, action = codename.split('.', 1)
            return cls.objects.get(resource=resource, action=action)
        except (ValueError, cls.DoesNotExist):
            return None