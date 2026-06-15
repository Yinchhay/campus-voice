import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.permissions import HasResourcePermission

from django.conf import settings
from api.models import EmailSetting

logger = logging.getLogger(__name__)


class AdminEmailSettingView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'setting'

    def get(self, request):
        setting = EmailSetting.get_setting()
        
        email_to_return = settings.EMAIL_HOST_USER
        updated_by_email = None
        updated_at = None

        if setting and setting.ticket_notification_email:
            email_to_return = setting.ticket_notification_email
            updated_by_email = setting.updated_by.email if setting.updated_by else None
            updated_at = setting.updated_at

        return Response({
            'ticket_notification_email': email_to_return,
            'updated_by': updated_by_email,
            'updated_at': updated_at,
        }, status=status.HTTP_200_OK)

    def put(self, request):
        """Set or update the designated admin email for ticket notifications."""
        email = request.data.get('ticket_notification_email')
        if not email:
            return Response(
                {'error': 'ticket_notification_email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create or update the singleton
        setting, created = EmailSetting.objects.update_or_create(
            pk=1,
            defaults={
                'ticket_notification_email': email,
                'updated_by': request.user,
            }
        )

        logger.info(f"Email setting updated by {request.user.email}: notifications → {email}")

        return Response({
            'ticket_notification_email': setting.ticket_notification_email,
            'updated_by': setting.updated_by.email if setting.updated_by else None,
            'updated_at': setting.updated_at,
        }, status=status.HTTP_200_OK)
