import requests
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

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
        
        serializer = PublicMessageSerializer(
            ticket.messages.select_related('sender').prefetch_related('attachment').all(), 
            many=True
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @transaction.atomic
    def post(self, request, ticket_id):
        ticket, error = get_ticket(ticket_id, request.user)
        if error:
            return error
        
        if ticket.status == Ticket.Status.RESOLVED:
            return Response(
                {'error': 'Cannot send messages on a resolved ticket'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PublicMessageSerializer(
            data=request.data,
            context={'request': request}  # needed for file upload in create()
        )
        if serializer.is_valid():
            sender = None if ticket.is_anonymous else request.user
            message = serializer.save(
                ticket=ticket,
                sender=sender,
                is_staff_message=False,
            )    

            email_log = "Anonymous" if ticket.is_anonymous else request.user.email
            logger.info(
                f"Student Message on {ticket.public_ticket_id} "
                f"by {email_log}"
            )

            # Broadcast live update
            try:
                channel_layer = get_channel_layer()
                if channel_layer:
                    async_to_sync(channel_layer.group_send)(
                        f"ticket_{ticket.id}",
                        {
                            "type": "chat_message",
                            "message_id": message.id
                        }
                    )
            except Exception as e:
                logger.error(f"Error broadcasting student message: {e}")

            return Response(
                PublicMessageSerializer(message).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
