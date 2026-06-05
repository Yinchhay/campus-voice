from rest_framework.response import Response
from rest_framework import status
from api.models import Ticket

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