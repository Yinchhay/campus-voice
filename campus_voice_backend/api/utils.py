import re
import hmac
import hashlib
import itertools
from django.conf import settings
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from django.core.cache import cache
from better_profanity import profanity
from api.models import ProfanityWord, Ticket

WORD_PATTERN = re.compile(r"\b\w+(?:\W+\w+)*\b", re.UNICODE)
SPACED_OUT_PATTERN = re.compile(r"\b(\w)(?:\W|\s)+(?=\w\b)", re.UNICODE | re.IGNORECASE)

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
    
    # Remove 'god' from the censor list so it is allowed
    if hasattr(profanity, 'CENSOR_WORDSET'):
        wordset = profanity.CENSOR_WORDSET
        if isinstance(wordset, set):
            wordset.discard('god')
        elif isinstance(wordset, list):
            while 'god' in wordset:
                wordset.remove('god')

    return profanity

def censor_profanity(value):
    if not value:
        return value

    # 1. Preprocess: Join spaced-out single letters (e.g. "f u c k" -> "fuck", "f-u-c-k" -> "fuck")
    value = SPACED_OUT_PATTERN.sub(r"\1", value)

    profanity_filter = get_profanity_filter()
    censored = profanity_filter.censor(value)

    def censor_stretched_word(match):
        word = match.group(0)
        lower_word = word.lower()
        
        # 1. Group identical consecutive characters (e.g. "fuuuck" -> [('f',1), ('u',3), ('c',1), ('k',1)])
        groups = [(char, len(list(g))) for char, g in itertools.groupby(lower_word)]
        
        # 2. Build options for each character group
        options_list = []
        multi_option_count = 0
        for char, count in groups:
            if count == 1:
                options_list.append([char])
            elif count == 2 and char in ('o', 'e'):
                # Protect 'oo' and 'ee' to prevent false positives on 'good' and 'sheet'
                options_list.append([char * 2])
            else:
                # For all other stretched characters, test both the 1-letter and 2-letter forms
                # This ensures we catch both "fuuuck" -> "fuck" and "asss" -> "ass"
                options_list.append([char, char * 2])
                multi_option_count += 1
                
        # DOS Protection: If there are too many stretched groups, fallback to single-char collapse
        if multi_option_count > 6:
            options_list = []
            for char, count in groups:
                if count == 2 and char in ('o', 'e'):
                    options_list.append([char * 2])
                else:
                    options_list.append([char])
                    
        # 3. Generate all combinations of the normalized word
        candidates = [''.join(combo) for combo in itertools.product(*options_list)]
        
        # 4. Check if any candidate (or its symbol-stripped version) is profane
        for candidate in candidates:
            candidate_clean = re.sub(r"[^a-z0-9]", "", candidate)
            
            if (candidate != lower_word or candidate_clean != lower_word) and (
                profanity_filter.contains_profanity(candidate) or 
                profanity_filter.contains_profanity(candidate_clean)
            ):
                return "****"
                
        return word

    return WORD_PATTERN.sub(censor_stretched_word, censored)
