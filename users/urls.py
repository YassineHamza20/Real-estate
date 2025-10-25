from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('verify-seller/', views.SellerVerificationView.as_view(), name='verify-seller'),
    path('verification-status/', views.check_verification_status, name='verification-status'),
    path('submit-verification/', views.submit_verification, name='submit-verification'),
    path('password-reset/', views.password_reset_request, name='password-reset-request'),
    path('password-reset-confirm/<str:uid>/<str:token>/', views.password_reset_confirm, name='password-reset-confirm'),
]