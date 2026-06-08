from django.db import models
from .permission import Permission

class AdminRole(models.Model):
    name = models.CharField(
        max_length=50,
        help_text="Name e.g., 'View Tickets', 'Approve Tickets'"
    )
    description = models.TextField(
        blank=True,
        help_text="Description of this role's responsibilities"
    )
    is_superadmin = models.BooleanField(
        default=False,
        help_text="If True, users with this role bypass all permission checks"
    )
    permissions = models.ManyToManyField(
        Permission,
        blank=True,
        related_name='roles',
        help_text="Permissions granted to this role"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'admin_role'
        ordering = ['-is_superadmin', 'name']
        verbose_name = 'Admin Role'
        verbose_name_plural = 'Admin Roles'

    def __str__(self):
        return self.name
    
    def has_permission(self, resource: str, action: str) -> bool:
        if self.is_superadmin:
            return True
        return self.permissions.filter(resource=resource, action=action).exists()
    
    def has_permission_codename(self, codename: str) -> bool:
        if self.is_superadmin:
            return True
        try:
            resource, action = codename.split('.', 1)
            return self.has_permission(resource, action)
        except ValueError:
            return False
    
    def get_all_permissions(self):
        if self.is_superadmin:
            return ['*']
        return list(self.permissions.values_list('resource', 'action'))
    
    def add_permission(self, resource: str, action: str):
        permission = Permission.objects.filter(resource=resource, action=action).first()
        if permission:
            self.permissions.add(permission)
            return True
        return False
    
    def remove_permission(self, resource: str, action: str):
        permission = Permission.objects.filter(resource=resource, action=action).first()
        if permission:
            self.permissions.remove(permission)
            return True
        return False