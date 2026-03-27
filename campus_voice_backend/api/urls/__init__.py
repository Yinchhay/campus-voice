from django.urls import path, include

app_name = 'api'

urlpatterns = [
    path('v1/', include('api.urls.public_urls')),
    path('admin/', include('api.urls.admin_urls')),
]