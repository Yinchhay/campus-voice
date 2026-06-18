import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.permissions import HasResourcePermission
from django.db import transaction
from django.db.models import Q

from api.models import Category
from api.serializers import CategorySerializer, CategoryDetailSerializer
from api.utils import get_paginated_response

logger = logging.getLogger(__name__)

class AdminCategoryListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'category'
    
    def get(self, request):
        filters = request.query_params.get('filters', '')
        sort_by = request.query_params.get('sort_by', 'name')
        sort_desc = request.query_params.get('sort_desc', 'false').lower() == 'true'

        categories = Category.objects.all()

        if filters:
            categories = categories.filter(
                Q(name__icontains=filters) |
                Q(description__icontains=filters)
            )

        allowed_sort_fields = ['name', 'created_at']
        if sort_by not in allowed_sort_fields:
            sort_by = 'name'

        order_field = f'-{sort_by}' if sort_desc else sort_by
        categories = categories.order_by(order_field)

        return get_paginated_response(categories, request, CategorySerializer)
    
    @transaction.atomic
    def post(self, request):
        try:
            serializer = CategorySerializer(data=request.data)
            
            if serializer.is_valid():
                category = serializer.save()
                
                logger.info(f"Category created by admin: {serializer.data}")
                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            logger.error(f"Error creating category: {str(e)}", exc_info=True)
            return Response(
                {'error': "Failed to create category"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
class AdminCategoryDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'category'
    
    def get(self, request, category_id):
        try:
            category = Category.objects.get(id=category_id)
            serializer = CategoryDetailSerializer(category)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Category.DoesNotExist:
            return Response(
                {'error': 'Category not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error retrieving category {category_id}: {str(e)}", exc_info=True)
            return Response(
                    {'error': 'Failed to retrieve category'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
    @transaction.atomic
    def patch(self, request, category_id):
        try:
            category = Category.objects.get(id=category_id)
            serializer = CategoryDetailSerializer(category, data=request.data, partial=True)
            
            if serializer.is_valid():
                category = serializer.save()

                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Category.DoesNotExist:
            return Response(
                {'error': 'Category not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating category {category_id}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to update category'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )        
    def delete(self, request, category_id):
        try:
            category = Category.objects.get(id=category_id)
            category_name = category.name
            category.delete()
            
            response_data = {
                'success': True,
                'message': f'Category "{category_name}" deleted successfully'
            }            
            logger.info(f"Category {category_id} ({category_name}) deleted by admin")
                   
            return Response(response_data, status=status.HTTP_200_OK) 
        
        except Category.DoesNotExist:
            return Response(
                {'error': 'Category not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deleting category: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to delete category'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
            