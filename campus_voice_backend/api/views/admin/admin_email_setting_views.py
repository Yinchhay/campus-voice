import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.permissions import HasResourcePermission

from api.models import EmailSetting

logger = logging.getLogger(__name__)


class AdminEmailSettingView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'setting'

    def get(self, request):
        """Get the current email notification setting."""
        setting = EmailSetting.get_setting()
        if not setting:
            return Response({
                'ticket_notification_email': None,
                'updated_by': None,
                'updated_at': None,
            }, status=status.HTTP_200_OK)

        return Response({
            'ticket_notification_email': setting.ticket_notification_email,
            'updated_by': setting.updated_by.email if setting.updated_by else None,
            'updated_at': setting.updated_at,
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
