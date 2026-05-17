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
    
    # ---------------------------------------------------------------------------- #
    #                                    User                                      #
    # ---------------------------------------------------------------------------- #
    path('user/me', views.GetMeView.as_view(), name='me'),
    
    
    
    
    
]
