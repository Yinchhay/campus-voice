import requests
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from django.utils import timezone
from api.models import Ticket, Category

from api.serializers import TicketSerializer, TicketDetailSerializer

logger = logging.getLogger(__name__)

class TicketListView(APIView):
    permission_classes=[IsAuthenticated]
    
    def get(self, request):
        tickets = Ticket.objects.filter(submitted_by=request.user)
        serializer = TicketSerializer(tickets, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    
    def post(self, request):
        serializer = TicketSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                category = Category.objects.get(id=request.data.get('category'))
                ticket = serializer.save(
                    submitted_by=request.user,
                    priority=category.priority_level
                )
                logger.info(f"Ticket created by {request.user.email}")
                return Response(
                    TicketDetailSerializer(ticket).data,
                    status=status.HTTP_201_CREATED
                )
            except Category.DoesNotExist:
                return Response(
                    {'error': 'Category not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TicketDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id, submitted_by=request.user)
            serializer = TicketDetailSerializer(ticket)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Ticket.DoesNotExist:
            return Response(
                {'error': 'Ticket not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        