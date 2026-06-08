from django.db import models
from django.conf import settings

class UserRole(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_roles'
    )
    role = models.ForeignKey(
        'StaffRole',
        on_delete=models.CASCADE,
        related_name='user_assignments'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='role_assignments_made',
        help_text="User who assigned this role"
    )
    
    class Meta:
        db_table = 'admin_user_role'
        unique_together = ['user', 'role']
        verbose_name = 'User Role Assignment'
        verbose_name_plural = 'User Role Assignments'
    
    def __str__(self):
        return f"{self.user} - {self.role}"