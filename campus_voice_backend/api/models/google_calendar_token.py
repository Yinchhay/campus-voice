from django.db import models
from .user import User


class GoogleCalendarToken(models.Model):
    """
    Stores OAuth2 tokens for admins/staff who opt-in to Google Calendar sync.
    Uses per-user consent — no org admin permission required.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='google_calendar_token'
    )
    access_token = models.TextField()
    refresh_token = models.TextField()
    token_expiry = models.DateTimeField()
    calendar_email = models.EmailField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'google_calendar_token'

    def __str__(self):
        return f"Google Calendar token for {self.user.email}"
