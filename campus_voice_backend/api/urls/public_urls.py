from django.urls import path
from api import views

app_name='api'

urlpatterns = [
    # your public routes will go here
    
    # ---------------------------------------------------------------------------- #
    #                                   Health                                     #
    # ---------------------------------------------------------------------------- #
    path('health/', views.api_health, name='api_health'),
    
    
    path('auth/csrf', views.CsrfTokenView.as_view(), name='csrf'),
    path('auth/google', views.GoogleAuthView.as_view(), name='google_auth'),
    path('auth/logout', views.LogoutView.as_view(), name='logout'),
    path('auth/me', views.CurrentUserView.as_view(), name='me'),
    
    
    
    
    
]
