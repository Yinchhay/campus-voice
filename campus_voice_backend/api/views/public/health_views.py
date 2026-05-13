from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def api_health(request):
    return Response(
        {
            "status": "success",
            "message": "Django REST API is working!",
        }
    )
