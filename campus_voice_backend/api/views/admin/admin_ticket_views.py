import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.permissions import HasResourcePermission
from django.db.models import Q

from api.models import Ticket
from api.serializers import TicketSerializer, TicketDetailSerializer
from api.utils import CustomPageNumberPagination, get_paginated_response


logger = logging.getLogger(__name__)

class AdminTicketListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'ticket'
    
    def get(self, request):
        filters = request.query_params.get('filters', '')
        sort_by = request.query_params.get('sort_by', 'created_at')
        sort_desc = request.query_params.get('sort_desc', 'true').lower() == 'true'

        tickets = Ticket.objects.prefetch_related('attachments').all()

        if filters:
            tickets = tickets.filter(
                Q(title__icontains=filters) |
                Q(public_ticket_id__icontains=filters) |
                Q(description__icontains=filters)
            )

        allowed_sort_fields = ['created_at', 'updated_at', 'status']
        if sort_by not in allowed_sort_fields:
            sort_by = 'created_at'

        order_field = f'-{sort_by}' if sort_desc else sort_by
        tickets = tickets.order_by(order_field)

        return get_paginated_response(tickets, request, TicketSerializer)
    
class AdminTicketDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'ticket'
    
    def get(self, request, ticket_id):
        try:
            ticket = Ticket.objects.prefetch_related(
                    'attachments',
                    'messages__attachment',
                    'resolution__attachments',
                ).get(id=ticket_id)
            serializer = TicketDetailSerializer(ticket)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error retrieving ticket {ticket_id}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve ticket'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )