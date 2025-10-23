# dashboard/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.admin_dashboard, name='admin_dashboard'),
    path('api/', views.dashboard_api, name='dashboard-api'),   
    path('export-pdf/', views.export_dashboard_pdf, name='export-pdf'),  
    path('export-excel/', views.export_dashboard_excel, name='export-excel'),  
    
]