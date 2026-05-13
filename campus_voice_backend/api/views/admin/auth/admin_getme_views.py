from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from api.models import UserRole

class AdminGetMeView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        user = user.
        