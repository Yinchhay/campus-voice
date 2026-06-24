from django.urls import re_path
from api.consumers import TicketChatConsumer

websocket_urlpatterns = [
    re_path(r'^ws/tickets/(?P<ticket_id>[^/]+)/$', TicketChatConsumer.as_asgi()),
]
