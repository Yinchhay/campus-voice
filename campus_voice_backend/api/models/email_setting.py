from django.db import models
from django.conf import settings


class EmailSetting(models.Model):
    """
    Singleton settings table for email notifications.
    The superadmin sets which admin email receives new ticket notifications.
    """
    ticket_notification_email = models.EmailField(
        help_text="The admin email address that receives new ticket notifications"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_setting_updates',
        help_text="Last admin who updated this setting"
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'email_setting'
        verbose_name = 'Email Setting'

    def __str__(self):
        return f"Ticket notifications → {self.ticket_notification_email}"

    def save(self, *args, **kwargs):
        # Enforce singleton: always use pk=1
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_setting(cls):
        """Get the singleton instance, or None if not configured."""
        return cls.objects.filter(pk=1).first()
