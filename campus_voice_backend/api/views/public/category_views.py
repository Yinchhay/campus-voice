import requests

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from api.models import Category
from api.serializers import PublicCategoryListSerializer

class CategoryListView(APIView):
    permission_classes=[IsAuthenticated]
    
    def get(self, request):
        categories = Category.objects.all()
        serializer = PublicCategoryListSerializer(categories, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)