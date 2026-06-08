from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from api.serializers import AdminUserSerializer

class AdminGetMeView(APIView):
    permission_classes=[IsAdminUser]
    
    def get(self, request):
        serializer = AdminUserSerializer(request.user)
        
        return Response(
            {
                'success': True,
                'user': serializer.data
            },
            status=status.HTTP_200_OK
        )