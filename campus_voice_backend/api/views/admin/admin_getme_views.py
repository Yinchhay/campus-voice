from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.permissions import HasResourcePermission, IsAdminSide
from api.serializers import AdminUserSerializer, AdminChangePasswordSerializer

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

class AdminChangePasswordView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminSide]
    
    def post(self, request):
        user = request.user
        serializer = AdminChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            if not user.check_password(serializer.validated_data['current_password']):
                return Response({'error': 'Incorrect current password.'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)