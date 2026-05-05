from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import logging
from django.conf import settings
from django.utils import timezone
from api.serializers import UserSerializer

User = get_user_model()
logger = logging.getLogger(__name__)

class AdminLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            
            # Only allow staff
            if not user.is_staff:
                logger.warning(f"Non-staff login attempt for email: {email}")
                return Response(
                    {'error': 'Invalid credentials.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        except User.DoesNotExist:
            logger.warning(f"Failed admin login attempt for email: {email}")
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check password
        if not user.check_password(password):
            logger.warning(f"Failed admin login attempt for email: {email}")
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        
        refresh_token_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
        access_token_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
        
        now = timezone.now()
        refresh_token_expiry = now + refresh_token_lifetime
        access_token_expiry = now + access_token_lifetime
        
        # Update last login
        user.last_login = now
        user.save(update_fields=['last_login'])
        
        user_serializer = UserSerializer(user)
        
        return Response(
            {
                'success': True,
                'message': 'Admin login successful',
                'access_token': access_token,
                'refresh_token': str(refresh),
                'access_token_expires_at': access_token_expiry.isoformat(),
                'refresh_token_expires_at': refresh_token_expiry.isoformat(),
                'user': user_serializer.data
            },
            status=status.HTTP_200_OK
        )