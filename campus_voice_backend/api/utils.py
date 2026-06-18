from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from api.models import Ticket

class CustomPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

def get_paginated_response(queryset, request, serializer_class):
    paginator = CustomPageNumberPagination()
    paginated = paginator.paginate_queryset(queryset, request)
    serializer = serializer_class(paginated, many=True)
    return paginator.get_paginated_response(serializer.data)

def get_ticket(ticket_id, user):
    """Reusable ticket lookup for student-owned tickets."""
    try:
        ticket = Ticket.objects.get(id=ticket_id, submitted_by=user)
        return ticket, None
    except Ticket.DoesNotExist:
        return None, Response(
            {'error': 'Ticket not found'},
            status=status.HTTP_404_NOT_FOUND
        )
        
def get_admin_ticket(ticket_id):
    """For staff/admin — can access any ticket."""
    try:
        ticket = Ticket.objects.get(id=ticket_id)
        return ticket, None
    except Ticket.DoesNotExist:
        return None, Response(
            {'error': 'Ticket not found'},
            status=status.HTTP_404_NOT_FOUND
        )