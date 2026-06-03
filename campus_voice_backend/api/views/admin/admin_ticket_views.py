import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.db import transaction

from api.models import Ticket
from api.serializers import TicketSerializer


logger = logging.getLogger(__name__)

class AdminTicketListView(APIView):
    permission_classes=[IsAdminUser]
    
    def get(self, request):
        categories = Ticket.objects.all()
        serializer = TicketSerializer(categories, many=True)
    
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class AdminTicketDetailView(APIView):
    permission_classes=[IsAdminUser]
    
    def get(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
            serializer = TicketSerializer(ticket)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error retrieving ticket {ticket_id}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve ticket'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )