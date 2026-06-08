import requests
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from api.utils import get_ticket
from api.models import Resolution
from api.serializers import ResolutionSerializer

logger = logging.getLogger(__name__)

class ResolutionView(APIView):
    permission_classes=[IsAuthenticated]
    
    def get(self, request, ticket_id):
        ticket, error = get_ticket(ticket_id, request.user)
        if error:
            return error
        
        try:
            serializer = ResolutionSerializer(ticket.resolution)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Resolution.DoesNotExist:
            return Response(
                {'error': 'No resolution found for this ticket'},
                status=status.HTTP_404_NOT_FOUND
            )
    