import requests

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from api.models import Category
from api.serializers import PublicCategoryListSerializer

class CategoryListView(APIView):
    permission_classes=[IsAuthenticated]
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def get(self, request):
        categories = Category.objects.filter(is_active=True)
        serializer = PublicCategoryListSerializer(categories, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)