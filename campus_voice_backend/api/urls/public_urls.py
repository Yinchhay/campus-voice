from django.urls import path
from api import views

app_name='api'

urlpatterns = [
    # your public routes will go here
    
    # ---------------------------------------------------------------------------- #
    #                                   Health                                     #
    # ---------------------------------------------------------------------------- #
    path('health/', views.api_health, name='api_health'),

    
    # ---------------------------------------------------------------------------- #
    #                                    Auth                                      #
    # ---------------------------------------------------------------------------- #
    path('auth/google', views.GoogleAuthView.as_view(), name='google_auth'),
    path('auth/refresh', views.RefreshTokenView.as_view(), name='refresh_token'),
    
    # ---------------------------------------------------------------------------- #
    #                                    User                                      #
    # ---------------------------------------------------------------------------- #
    path('user/me', views.GetMeView.as_view(), name='me'),
    
    # ---------------------------------------------------------------------------- #
    #                                   Ticket                                     #
    # ---------------------------------------------------------------------------- #
    path('tickets/', views.TicketListView.as_view(), name='ticket_list'),
    path('tickets/<str:ticket_id>', views.TicketDetailView.as_view(), name='ticket_detail'),
    
    
    
    
]
