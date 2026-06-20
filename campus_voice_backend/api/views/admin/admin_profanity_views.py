from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.permissions import HasResourcePermission
from api.models import ProfanityWord
from api.serializers.admin_serializers import AdminProfanityWordSerializer
from django.core.cache import cache

class AdminProfanityWordListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'setting'
    
    def get(self, request):
        words = ProfanityWord.objects.all()
        serializer = AdminProfanityWordSerializer(words, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = AdminProfanityWordSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            cache.delete('profanity_words')  # Invalidate cache so the new word takes effect immediately
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminProfanityWordDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'setting'
    
    def delete(self, request, word_id):
        try:
            word = ProfanityWord.objects.get(id=word_id)
            word.delete()
            cache.delete('profanity_words')
            
            return Response({'message': 'Word deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except ProfanityWord.DoesNotExist:
            return Response({'error': 'Word not found'}, status=status.HTTP_404_NOT_FOUND)

