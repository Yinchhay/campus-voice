import jwt
import requests
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.db import transaction
from api.models import User
from api.serializers import UserSerializer

logger = logging.getLogger(__name__)

class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        
        try:
            token = request.data.get('token')

            if not token:
                return Response(
                    {'error': 'id_token and email are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Verify token with Google and get user info
            user_info = self.verify_google_token(token)
            if not user_info:
                return Response(
                    {'error': 'Invalid or expired Google token'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            print(user_info)
            email = user_info.get('email')
            
            # Validate Paragon email domain
            if not email or not email.endswith(settings.ALLOWED_EMAIL_DOMAIN):
                logger.warning(f"Unauthorized email domain: {email}")
                return Response(
                    {'error': f'Only {settings.ALLOWED_EMAIL_DOMAIN} email addresses are allowed'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get or create user
            user, created = self.get_or_create_user(user_info)
            
            # Generate JWT tokens
            return self.generate_token_response(user, created)
        
        except Exception as e:
            logger.error(f"Google auth error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Authentication failed', 'detail': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    def verify_google_token(self, token):
        """
        Verify Google ID token using Google's tokeninfo endpoint
        Returns user info if valid, None if invalid
        
        Google's tokeninfo endpoint returns:
        {
            "iss": "https://accounts.google.com",
            "sub": "google_user_id",
            "email": "user@paragon.edu",
            "email_verified": true,
            "aud": "your_client_id",
            "given_name": "John",
            "family_name": "Doe",
            "picture": "https://...",
            "locale": "en"
        }
        """
        try:
            # Use Google's tokeninfo endpoint to verify the token
            google_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
            response = requests.get(google_url, timeout=10)
            
            if response.status_code != 200:
                logger.warning(f"Google token validation failed: {response.status_code}")
                return None
            
            user_info = response.json()

            # Verify the token is for our app
            if user_info.get('aud') != settings.GOOGLE_OAUTH_CLIENT_ID:
                logger.warning(f"Token audience mismatch: {user_info.get('aud')}")
                return None

            # Verify email is verified by Google
            if not user_info.get('email_verified'):
                logger.warning(f"Email not verified by Google: {user_info.get('email')}")
                return None
            
            return {
                'google_id': user_info.get('sub'),
                'email': user_info.get('email'),
                'first_name': user_info.get('given_name', ''),
                'last_name': user_info.get('family_name', ''),
                'picture': user_info.get('picture', ''),
            }
            
        except requests.RequestException as e:
            logger.error(f"Google token validation network error: {e}")
            return None
        except Exception as e:
            logger.error(f"Google token verification error: {e}", exc_info=True)
            return None
        
    @transaction.atomic
    def get_or_create_user(self, user_info):
        """Get existing user or create new one"""
        email = user_info['email']
        google_id = user_info['google_id']

        # Try to get existing user by email
        try:
            user = User.objects.get(email=email)

            if not user.google_id:
                user.google_id = google_id
                user.save(update_fields=['google_id'])
            logger.info(f"User logged in: {email}")
            return user, False

        except User.DoesNotExist:
            # Create new user

            username = email.split('@')[0]

            # Ensure unique username
            original_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1

            user = User.objects.create_user(
                email=email,
                username=username,
                google_id=google_id,
                first_name=user_info.get('first_name', ''),
                last_name=user_info.get('last_name', ''),
                is_active=True,
                role=User.Role.STUDENT, 
            )

            logger.info(f"New user created: {email}")
            return user, True
    
    def generate_token_response(self, user, created):
        """Generate JWT response"""
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        user_serializer = UserSerializer(user)
        
        return Response(
            {
                'success': True,
                'message': 'User created' if created else 'User logged in',
                'access_token': str(access_token),
                'refresh_token': str(refresh),
                'user': user_serializer.data
            },
            status=status.HTTP_200_OK
        )