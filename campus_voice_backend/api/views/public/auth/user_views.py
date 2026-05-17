import requests
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.conf import settings
from django.contrib.auth import login, logout
from django.utils.decorators import method_decorator
from django.db import transaction
from api.serializers import UserSerializer
from api.models import User



class GetMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != User.Role.STUDENT:
            return Response(
                {'error': 'Student session required'},
                status=status.HTTP_403_FORBIDDEN 
            )
        
        serializer = UserSerializer(user)
        
        return Response(serializer.data, status=status.HTTP_200_OK)