from django.urls import path
from api.views import AdminLoginView, AdminGetMeView

app_name = 'admin'

urlpatterns = [
    # your admin routes will go here
    # ---------------------------------------------------------------------------- #
    #                                Admin Auth                                    #
    # ---------------------------------------------------------------------------- #
    path('login', AdminLoginView.as_view(), name='admin_login'),
    
    path('me', AdminGetMeView.as_view(), name='admin_me')
    
    # ---------------------------------------------------------------------------- #
    #                                  Admin Category Management                                     #
    # ---------------------------------------------------------------------------- #
    
    
    
]