# users/urls.py
from django.urls import path
from . import views

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

]