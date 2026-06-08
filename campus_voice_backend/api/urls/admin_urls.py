from django.urls import path
from api.views import (
    AdminLoginView, 
    AdminGetMeView,
    AdminUserListView,
    AdminUserDetailView,
    AdminCategoryListView, 
    AdminCategoryDetailView,
    AdminTicketListView,
    AdminTicketDetailView,
    AdminMessageView,
    AdminResolutionView,
)

app_name = 'admin'

urlpatterns = [
    # your admin routes will go here
    # ---------------------------------------------------------------------------- #
    #                                Admin Auth                                    #
    # ---------------------------------------------------------------------------- #
    path('login', AdminLoginView.as_view(), name='admin_login'),
    
    path('me', AdminGetMeView.as_view(), name='admin_me'),
    
    # ---------------------------------------------------------------------------- #
    #                           Admin User Management                              #
    # ---------------------------------------------------------------------------- #
    path('users', AdminUserListView.as_view(), name='admin_user_list'),
    path('users/<str:user_id>', AdminUserDetailView.as_view(), name='admin_user_detail'),
    
    # ---------------------------------------------------------------------------- #
    #                          Admin Category Management                           #
    # ---------------------------------------------------------------------------- #
    path('categories', AdminCategoryListView.as_view(), name='admin_category_list'),
    path('categories/<int:category_id>', AdminCategoryDetailView.as_view(), name='admin_category_detail'),
    
    # ---------------------------------------------------------------------------- #
    #                           Admin Ticket Management                            #
    # ---------------------------------------------------------------------------- #
    path('tickets', AdminTicketListView.as_view(), name='admin_ticket_list'),
    path('tickets/<str:ticket_id>', AdminTicketDetailView.as_view(), name='admin_ticket_detail'),
    
    # ---------------------------------------------------------------------------- #
    #                              Message Management                              #
    # ---------------------------------------------------------------------------- #
    path('tickets/<str:ticket_id>/messages', AdminMessageView.as_view(), name='admin_message_list'),
    
    # ---------------------------------------------------------------------------- #
    #                             Resolution Management                            #
    # ---------------------------------------------------------------------------- #
    path('tickets/<str:ticket_id>/resolution', AdminResolutionView.as_view(), name='admin_resolution'),

]