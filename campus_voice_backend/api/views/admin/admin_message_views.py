import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.permissions import HasResourcePermission
from django.db import transaction

from api.utils import get_admin_ticket
from api.models import Ticket
from api.serializers import AdminMessageSerializer

logger = logging.getLogger(__name__)

class AdminMessageView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'message'

    def get(self, request, ticket_id):
        ticket, error = get_admin_ticket(ticket_id)
        if error:
            return error
        
        serializer = AdminMessageSerializer(
            ticket.messages.select_related('sender').prefetch_related('attachment').all(),
            many=True
        )
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @transaction.atomic
    def post(self, request, ticket_id):
        ticket, error = get_admin_ticket(ticket_id)
        if error:
            return error
        
        if ticket.status == Ticket.Status.RESOLVED:
            return Response(
                {'error': 'Cannot send messages on a resolved ticket'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AdminMessageSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            message = serializer.save(
                ticket=ticket,
                sender=request.user,
                is_staff_message=True,
            )
            
            if ticket.status == Ticket.Status.SUBMITTED:
                ticket.status = Ticket.Status.IN_PROGRESS
                ticket.save(update_fields=['status', 'updated_at'])
                logger.info(f"Ticket {ticket.public_ticket_id} → IN_PROGRESS")
                
            logger.info(
                f"Staff reply on {ticket.public_ticket_id} "
                f"by {request.user.email}"
            )
            return Response(
                AdminMessageSerializer(message).data,
                status=status.HTTP_201_CREATED
            )
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
