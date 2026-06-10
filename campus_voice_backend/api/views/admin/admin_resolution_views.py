import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.permissions import HasResourcePermission
from django.db import transaction
from django.utils import timezone

from api.utils import get_admin_ticket
from api.models import Ticket, Resolution
from api.serializers import ResolutionSerializer

logger = logging.getLogger(__name__)

class AdminResolutionView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'resolution'
    
    def get(self, request, ticket_id):
        ticket, error = get_admin_ticket(ticket_id)
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
        
    
    @transaction.atomic
    def post(self, request, ticket_id):
        ticket, error = get_admin_ticket(ticket_id)
        if error:
            return error

        if ticket.status == Ticket.Status.RESOLVED:
            return Response(
                {'error': 'Ticket is already resolved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ResolutionSerializer(
            data=request.data,
            context={'request': request} 
        )
        if serializer.is_valid():
            serializer.save(
                ticket=ticket,
                resolved_by=request.user,
            )
            # Mark ticket as resolved
            ticket.status = Ticket.Status.RESOLVED
            ticket.resolved_at = timezone.now()
            ticket.save(update_fields=['status', 'resolved_at', 'updated_at'])

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
    @transaction.atomic
    def patch(self, request, ticket_id):
        ticket, error = get_admin_ticket(ticket_id)
        if error:
            return error

        try:
            resolution = ticket.resolution
        except Resolution.DoesNotExist:
            return Response(
                {'error': 'No resolution found, use POST to create one'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ResolutionSerializer(
            resolution,
            data=request.data,
            partial=True,
            context={'request': request}  # needed for file upload in update()
        )
        if serializer.is_valid():
            serializer.save()
            logger.info(
                f"Resolution for ticket {ticket.public_ticket_id} "
                f"updated by {request.user.email}"
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)