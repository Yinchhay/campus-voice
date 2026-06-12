import requests
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction

from django.utils import timezone
from api.models import Ticket, Category

from api.serializers import PublicTicketSerializer, PublicTicketDetailSerializer
from api.services.email_service import send_new_ticket_notification_to_admin

logger = logging.getLogger(__name__)

class TicketListView(APIView):
    permission_classes=[IsAuthenticated]
    
    def get(self, request):
        tickets = Ticket.objects.filter(submitted_by=request.user).prefetch_related('attachments')
        serializer = PublicTicketSerializer(tickets, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @transaction.atomic
    def post(self, request):
        category_id = request.data.get('category')
        if not category_id:
            return Response(
                {'error': 'Category is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PublicTicketSerializer(
            data=request.data,
            context={'request': request}   # needed for file upload in create()
        )
        
        if serializer.is_valid():
            try:
                category = Category.objects.get(id=category_id)
                ticket = serializer.save(
                    submitted_by=request.user,
                    priority=category.priority_level
                )
                logger.info(f"Ticket created by {request.user.email}")
                
                # Send email notification to all admins
                send_new_ticket_notification_to_admin(ticket)
                
                return Response(
                    PublicTicketDetailSerializer(ticket).data,
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
            ticket = Ticket.objects.prefetch_related(
                    'attachments',
                    'messages__attachment',
                    'resolution__attachments',
                ).get(id=ticket_id)
            if ticket.submitted_by != request.user:
                return Response(
                    {'error': 'You do not have permission to view this ticket'},
                    status=status.HTTP_403_FORBIDDEN
                )
            serializer = PublicTicketDetailSerializer(ticket)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Ticket.DoesNotExist:
            return Response(
                {'error': 'Ticket not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        