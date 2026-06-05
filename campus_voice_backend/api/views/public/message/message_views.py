import requests
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from api.utils import get_ticket
from api.models import Ticket
from api.serializers import PublicMessageSerializer

logger = logging.getLogger(__name__)

class MessageView(APIView):
    permission_classes=[IsAuthenticated]
    
    def get(self, request, ticket_id):
        ticket, error = get_ticket(ticket_id, request.user)
        if error:
            return error
        
        serializer = PublicMessageSerializer(ticket.message.all(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @transaction.atomic
    def post(self, request, ticket_id):
        ticket, error = self.get_ticket(ticket_id)
        if error:
            return error
        
        if ticket.status == Ticket.Status.RESOLVED:
            return Response(
                {'error': 'Cannot send messages on a resolved ticket'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PublicMessageSerializer(data=request.data)
        if serializer.is_valid():
            message = serializer.save(
                ticket=ticket,
                sender=request.user,
                is_staff_message=False,
            )    

            logger.info(
                f"Staff reply on {ticket.public_ticket_id} "
                f"by {request.user.email}"
            )
            return Response(
                PublicMessageSerializer(message).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
