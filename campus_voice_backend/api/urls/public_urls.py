from django.urls import path
from api import views

app_name='api'

urlpatterns = [
    # your public routes will go here
    path('auth/google', views.GoogleAuthView.as_view(), name='google_auth'),
    
]