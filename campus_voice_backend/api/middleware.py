from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware

User = get_user_model()

import logging
logger = logging.getLogger(__name__)

@database_sync_to_async
def get_user_from_token(token_string):
    try:
        print(f"[WS Auth] Decoding token: {token_string[:15]}...")
        access_token = AccessToken(token_string)
        user_id = access_token['user_id']
        print(f"[WS Auth] Token user_id found: {user_id}")
        user = User.objects.get(id=user_id)
        print(f"[WS Auth] Authenticated user: {user.email}")
        return user
    except Exception as e:
        print(f"[WS Auth] Failed token decoding: {e}")
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]
        
        if token:
            user = await get_user_from_token(token)
            scope["user"] = user
        else:
            scope["user"] = AnonymousUser()
            
        return await super().__call__(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
