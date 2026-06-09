from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.permissions import HasResourcePermission, IsAdminSide
from api.serializers import AdminUserSerializer

class AdminGetMeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes=[IsAdminSide]
    
    def get(self, request):
        serializer = AdminUserSerializer(request.user)
        
        return Response(
            {
                'success': True,
                'user': serializer.data
            },
            status=status.HTTP_200_OK
        )