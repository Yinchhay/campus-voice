import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework import status
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            user_refresh_token = request.data.get('refresh_token')
            if not user_refresh_token:
                return Response({
                    'error': 'Refresh token is required'
                    },  status=status.HTTP_400_BAD_REQUEST
                )
            
            refresh_obj = RefreshToken(user_refresh_token)
            new_access_token = refresh_obj.access_token
            
            access_token_lifetime = settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME')
            now = timezone.now()
            access_token_expiry = now + access_token_lifetime
            
            return Response({
                'access_token': str(new_access_token),
                'access_token_expiry': access_token_expiry.isoformat(),
                'expires_in': int(access_token_lifetime.total_seconds()),
            }, status=status.HTTP_200_OK)
            
        except TokenError as e:
            logger.warning(f"Invalid refresh token attempt: {str(e)}")
            return Response({
                'error': 'Invalid or expired refresh token',
            }, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}", exc_info=True)
            return Response({
                'error': 'An error occurred while refreshing token',
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)