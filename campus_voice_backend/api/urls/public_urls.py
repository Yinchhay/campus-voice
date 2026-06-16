from django.urls import path
from api import views

app_name='api'

urlpatterns = [
    # your public routes will go here
    
    # ---------------------------------------------------------------------------- #
    #                                   Health                                     #
    # ---------------------------------------------------------------------------- #
    path('health', views.api_health, name='api_health'),

    
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
    #                                  Category                                    #
    # ---------------------------------------------------------------------------- #
    path('categories', views.CategoryListView.as_view(), name='category_list'),
    
    # ---------------------------------------------------------------------------- #
    #                                   Ticket                                     #
    # ---------------------------------------------------------------------------- #
    path('tickets', views.TicketListView.as_view(), name='ticket_list'),
    path('tickets/<str:ticket_id>', views.TicketDetailView.as_view(), name='ticket_detail'),
    
    # ---------------------------------------------------------------------------- #
    #                                   Message                                    #
    # ---------------------------------------------------------------------------- #
    path('tickets/<str:ticket_id>/messages', views.MessageView.as_view(), name='message_list'),
    
    # ---------------------------------------------------------------------------- #
    #                                  Resolution                                  #
    # ---------------------------------------------------------------------------- #
    path('tickets/<str:ticket_id>/resolution', views.ResolutionView.as_view(), name='resolution'),
    
    # ---------------------------------------------------------------------------- #
    #                                  Meetings                                    #
    # ---------------------------------------------------------------------------- #
    path('tickets/<str:ticket_id>/meetings', views.StudentMeetingSlotsView.as_view(), name='meeting_slots'),
    path('tickets/<str:ticket_id>/meetings/<int:slot_id>/confirm', views.StudentConfirmMeetingView.as_view(), name='confirm_meeting'),
    path('tickets/<str:ticket_id>/bookings/<int:booking_id>/cancel', views.StudentCancelMeetingView.as_view(), name='cancel_meeting'),
    path('my-bookings', views.StudentMyBookingsView.as_view(), name='my_bookings'),
    
]
