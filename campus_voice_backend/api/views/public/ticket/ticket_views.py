import requests
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction

from django.utils import timezone
from api.models import Ticket, Category

from django.db.models import Q
from api.utils import generate_author_hash
from api.serializers import PublicTicketSerializer, PublicTicketDetailSerializer
from api.tasks import send_new_ticket_notification_task

logger = logging.getLogger(__name__)

class TicketListView(APIView):
    permission_classes=[IsAuthenticated]
    
    def get(self, request):
        user_hash = generate_author_hash(request.user.id)
        tickets = Ticket.objects.filter(
            Q(submitted_by=request.user) | Q(author_hash=user_hash)
        ).select_related('category').prefetch_related('attachments')
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
                is_anon = serializer.validated_data.get('is_anonymous', False)
                
                if is_anon:
                    ticket = serializer.save(
                        submitted_by=None,
                        author_hash=generate_author_hash(request.user.id),
                        priority=category.priority_level
                    )
                else:
                    ticket = serializer.save(
                        submitted_by=request.user,
                        priority=category.priority_level
                    )
                
                if ticket.priority == Ticket.Priority.HIGH:
                    send_new_ticket_notification_task.delay(ticket.id)
                
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
            if ticket.submitted_by != request.user and ticket.author_hash != generate_author_hash(request.user.id):
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
        