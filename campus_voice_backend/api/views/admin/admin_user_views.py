from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from api.serializers import UserSerializer, StaffUserSerializer

class AdminCollectionListView(APIView):
    permission_classes=[IsAdminUser]