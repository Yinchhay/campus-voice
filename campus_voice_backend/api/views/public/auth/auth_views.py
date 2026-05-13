import requests
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.conf import settings
from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.db import transaction
from api.models import User

logger = logging.getLogger(__name__)


class StudentAuthError(Exception):
    pass


def serialize_student_session(user):
    return {
        'id': str(user.id),
        'email': user.email,
        'role': user.role,
        'is_active': user.is_active,
    }


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(csrf_protect)
    def post(self, request):
        
        try:
            token = request.data.get('token')

            if not token:
                return Response(
                    {'error': 'Google ID token is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Verify token with Google and get user info
            user_info = self.verify_google_token(token)
            if not user_info:
                return Response(
                    {'error': 'Invalid or expired Google token'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            email = user_info.get('email')
            
            # Validate Paragon email domain
            if not email or not email.lower().endswith(settings.ALLOWED_EMAIL_DOMAIN.lower()):
                logger.warning(f"Unauthorized email domain: {email}")
                return Response(
                    {'error': f'Only {settings.ALLOWED_EMAIL_DOMAIN} email addresses are allowed'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get or create user
            user, created = self.get_or_create_user(user_info)

            login(request, user)
            
            return Response(
                {
                    'success': True,
                    'message': 'User created' if created else 'User logged in',
                    'user': serialize_student_session(user),
                },
                status=status.HTTP_200_OK
            )
        
        except StudentAuthError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            logger.error(f"Google auth error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Authentication failed'}, 
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
            google_url = "https://oauth2.googleapis.com/tokeninfo"
            response = requests.get(google_url, params={'id_token': token}, timeout=10)
            
            if response.status_code != 200:
                logger.warning(f"Google token validation failed: {response.status_code}")
                return None
            
            user_info = response.json()

            # Verify the token is for our app
            if user_info.get('aud') != settings.GOOGLE_OAUTH_CLIENT_ID:
                logger.warning(f"Token audience mismatch: {user_info.get('aud')}")
                return None

            # Verify email is verified by Google
            if user_info.get('email_verified') not in (True, 'true', 'True', '1', 1):
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

            update_fields = []

            if user.google_id and user.google_id != google_id:
                logger.warning(f"Google ID mismatch for email: {email}")
                raise StudentAuthError('This Google account does not match the existing student account.')

            if not user.google_id:
                user.google_id = google_id
                update_fields.append('google_id')

            if user.role != User.Role.STUDENT:
                logger.warning(f"Non-student Google login attempt for email: {email}")
                raise StudentAuthError('This Google login is only available for students.')

            if user.is_staff:
                user.is_staff = False
                update_fields.append('is_staff')

            first_name = user_info.get('first_name', '')
            last_name = user_info.get('last_name', '')
            picture = user_info.get('picture', '')

            if first_name and user.first_name != first_name:
                user.first_name = first_name
                update_fields.append('first_name')
            if last_name and user.last_name != last_name:
                user.last_name = last_name
                update_fields.append('last_name')
            if picture and user.google_picture_url != picture:
                user.google_picture_url = picture
                update_fields.append('google_picture_url')

            if update_fields:
                user.save(update_fields=update_fields)

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
                google_picture_url=user_info.get('picture', ''),
                is_active=True,
                is_staff=False,
                role=User.Role.STUDENT, 
            )

            logger.info(f"New user created: {email}")
            return user, True


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != User.Role.STUDENT:
            return Response(
                {'error': 'Student session required'},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response(
            {'success': True, 'user': serialize_student_session(user)},
            status=status.HTTP_200_OK
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @method_decorator(csrf_protect)
    def post(self, request):
        logout(request)
        return Response({'success': True}, status=status.HTTP_200_OK)


class CsrfTokenView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response(
            {'success': True, 'csrfToken': get_token(request)},
            status=status.HTTP_200_OK
        )
