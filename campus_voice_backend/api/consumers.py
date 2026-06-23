import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from api.models import Ticket, User, Message
from api.serializers import PublicMessageSerializer, AdminMessageSerializer

@database_sync_to_async
def can_access_ticket(user, ticket_id):
    print(f"[WS Chat] Checking access for user: {user} on ticket_id: {ticket_id}")
    if user.is_anonymous:
        print("[WS Chat] Access denied: User is anonymous")
        return False
    try:
        ticket = Ticket.objects.get(id=ticket_id)
        print(f"[WS Chat] Found ticket: {ticket.public_ticket_id}, submitted_by: {ticket.submitted_by}")
        if user.role in [User.Role.STAFF, User.Role.ADMIN]:
            print(f"[WS Chat] Access granted: User has role {user.role}")
            return True
        allowed = ticket.submitted_by == user
        print(f"[WS Chat] Access evaluation: {allowed}")
        return allowed
    except Exception as e:
        print(f"[WS Chat] Access check failed with exception: {e}")
        return False

class TicketChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.ticket_id = self.scope['url_route']['kwargs']['ticket_id']
        self.room_group_name = f'ticket_{self.ticket_id}'
        user = self.scope.get('user')

        # Check authentication and access permissions
        if not user or user.is_anonymous or not await can_access_ticket(user, self.ticket_id):
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    @database_sync_to_async
    def get_serialized_message(self, message_id):
        try:
            message = Message.objects.select_related('sender').prefetch_related('attachment').get(id=message_id)
            user = self.scope.get('user')
            if user and user.role in [User.Role.STAFF, User.Role.ADMIN]:
                return AdminMessageSerializer(message).data
            else:
                return PublicMessageSerializer(message).data
        except Exception:
            return None

    # Receive message from room group
    async def chat_message(self, event):
        message_id = event['message_id']
        message_data = await self.get_serialized_message(message_id)
        if message_data:
            # Send message to WebSocket
            await self.send(text_data=json.dumps(message_data))
