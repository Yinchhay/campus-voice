import re
import hmac
import hashlib
from django.conf import settings
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from django.core.cache import cache
from better_profanity import profanity
from api.models import ProfanityWord, Ticket

WORD_PATTERN = re.compile(r"\b[\w']+\b", re.UNICODE)
REPEATED_CHAR_PATTERN = re.compile(r"(.)\1+", re.IGNORECASE)

class CustomPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

def get_paginated_response(queryset, request, serializer_class):
    paginator = CustomPageNumberPagination()
    paginated = paginator.paginate_queryset(queryset, request)
    serializer = serializer_class(paginated, many=True)
    return paginator.get_paginated_response(serializer.data)

def generate_author_hash(user_id):
    if not user_id:
        return None
    msg = str(user_id).encode('utf-8')
    key = settings.ANONYMOUS_IDENTITY_KEY.encode('utf-8')
    return hmac.new(key, msg, hashlib.sha256).hexdigest()

def get_ticket(ticket_id, user):
    """Reusable ticket lookup for student-owned tickets."""
    from django.db.models import Q
    try:
        user_hash = generate_author_hash(user.id)
        ticket = Ticket.objects.get(
            Q(id=ticket_id) & 
            (Q(submitted_by=user) | Q(author_hash=user_hash))
        )
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

def get_profanity_filter():
    custom_words = cache.get('profanity_words')

    if custom_words is None:
        custom_words = list(ProfanityWord.objects.values_list('word', flat=True))
        cache.set('profanity_words', custom_words, timeout=600)

    profanity.add_censor_words(custom_words)
    return profanity

def censor_profanity(value):
    if not value:
        return value

    profanity_filter = get_profanity_filter()
    censored = profanity_filter.censor(value)

    def censor_stretched_word(match):
        word = match.group(0)
        normalized = REPEATED_CHAR_PATTERN.sub(r"\1", word.lower())

        if normalized != word.lower() and profanity_filter.contains_profanity(normalized):
            return "****"

        return word

    return WORD_PATTERN.sub(censor_stretched_word, censored)
