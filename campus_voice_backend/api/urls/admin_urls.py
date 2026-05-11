from django.urls import path
from api.views import AdminLoginView

app_name = 'admin'

urlpatterns = [
    # your admin routes will go here
    path('login', AdminLoginView.as_view(), name='admin_login')
    
    
]