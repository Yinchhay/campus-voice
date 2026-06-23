import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
# Initialize Django ASGI application early to ensure AppRegistry is populated before routing imports
django_asgi_app = get_asgi_application()

from django.conf import settings
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from api.middleware import JWTAuthMiddlewareStack
from api.routing import websocket_urlpatterns

# Only enforce allowed hosts origin validator in production (when DEBUG is False)
if settings.DEBUG:
    websocket_stack = JWTAuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    )
else:
    websocket_stack = AllowedHostsOriginValidator(
        JWTAuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns
            )
        )
    )

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": websocket_stack,
})

