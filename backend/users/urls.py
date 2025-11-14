# users/urls.py
from django.urls import path
from . import views
from .views import admin_create_user
from .views import admin_delete_user
urlpatterns = [
    # Authentication endpoints
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('confirm-email/', views.confirm_email, name='confirm-email'),
    path('resend-confirmation/', views.resend_confirmation_email, name='resend-confirmation'),
    
    # User profile
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Seller verification
    path('verify-seller/', views.SellerVerificationView.as_view(), name='verify-seller'),
    path('verification-status/', views.check_verification_status, name='verification-status'),
    path('submit-verification/', views.submit_verification, name='submit-verification'),
    
    # Password reset
    path('password-reset/', views.password_reset_request, name='password-reset-request'),
    path('password-reset-confirm/<str:uid>/<str:token>/', views.password_reset_confirm, name='password-reset-confirm'),
    path('seller/<int:seller_id>/contact/', views.get_seller_contact_info, name='seller-contact-info'),



  path('admin/users/', views.AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:id>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/verifications/', views.AdminSellerVerificationListView.as_view(), name='admin-verification-list'),
    path('admin/verifications/<int:id>/', views.AdminSellerVerificationDetailView.as_view(), name='admin-verification-detail'),
    path('admin/stats/', views.admin_dashboard_stats, name='admin-dashboard-stats'),
    path('admin/bulk-users/', views.admin_bulk_user_actions, name='admin-bulk-users'),
    path('admin/bulk-verifications/', views.admin_bulk_verification_actions, name='admin-bulk-verifications'),
    path('admin/users/<int:user_id>/full/', views.admin_user_full_detail, name='admin-user-full-detail'),
    path('admin/verifications/stats/', views.admin_verifications_stats, name='admin-verifications-stats'),
    path('admin/verifications/bulk-action/', views.admin_verifications_bulk_action, name='admin-verifications-bulk-action'),


 
path('admin/analytics/', views.admin_analytics, name='admin-analytics'),
path('admin/analytics/properties/', views.admin_property_analytics, name='admin-property-analytics'),
path('admin/analytics/users/', views.admin_user_analytics, name='admin-user-analytics'),
path('admin/create-user/', admin_create_user, name='admin_create_user'),
  path('admin/users/<int:user_id>/delete/', admin_delete_user, name='admin_delete_user'),

]
