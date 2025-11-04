"""
URL configuration for real_estate project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

# real_estate/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views  
urlpatterns = [
    path('admin/', admin.site.urls),
    path('dashboard/', include('dashboard.urls')),
    path('api/users/', include('users.urls')),
   
    path('api/properties/', include('properties.urls')),  
    path('api/chatbot/', include('chatbot.urls')),

 path('api/debug/', views.debug_test, name='debug_test'),
     
      path('api/auth/test/', views.test_google_auth, name='test_auth'),
  path('api/auth/csrf/', views.get_csrf_token, name='get_csrf_token'),
    path('api/auth/success/', views.auth_success, name='auth_success'),
    path('api/auth/google/', views.google_auth, name='google_auth'),
    
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Custom admin titles
admin.site.site_header = "Real Estate Admin Dashboard"
admin.site.site_title = "Real Estate Admin"
admin.site.index_title = "Welcome to Real Estate Analytics"

