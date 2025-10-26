# users/views.py
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, SellerVerification
from .serializers import (
    UserRegistrationSerializer, 
    UserProfileSerializer, 
    SellerVerificationSerializer,
    EmailConfirmationSerializer,
    PasswordResetRequestSerializer, 
    PasswordResetConfirmSerializer
)
from rest_framework.permissions import AllowAny
from django.contrib.auth.tokens import default_token_generator  
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str   

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    try:
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Return success response but user is not active yet
            return Response({
                'message': 'Registration successful! Please check your email to confirm your account before logging in.',
                'user_id': user.id,
                'email': user.email
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            "error": "An unexpected error occurred during registration."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def confirm_email(request):
    """Confirm user's email address"""
    serializer = EmailConfirmationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        
        # Generate tokens for automatic login after confirmation
        user = serializer.user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Email confirmed successfully! Your account is now active.',
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    username_or_email = request.data.get('username')
    password = request.data.get('password')
    
    if not username_or_email or not password:
        return Response(
            {'error': 'Missing credentials'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = None
    
    # Don't reveal whether username/email exists for security
    try:
        if '@' in username_or_email:
            user_obj = User.objects.get(email=username_or_email)
        else:
            user_obj = User.objects.get(username=username_or_email)
        
        user = authenticate(username=user_obj.username, password=password)
        
        if user:
            if not user.email_verified:
                return Response(
                    {
                        'error': 'verification of your email is required',
                        'message': 'Please verify your email address to continue.',
                        'email': user.email,
                        'resend_url': '/api/users/resend-confirmation/'
                    }, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if not user.is_active:
                return Response(
                    {
                        'error': 'account_inactive',
                        'message': 'This account has been deactivated.'
                    }, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Successful login
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserProfileSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
            
    except User.DoesNotExist:
        pass  # Continue to generic error
    
    # Generic error for security (don't reveal if user exists)
    return Response(
        {
            'error': 'Invalid login credentials. Please check your username/email and password',
            'message': 'Invalid login credentials. Please check your username/email and password.'
        }, 
        status=status.HTTP_401_UNAUTHORIZED
    )

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def resend_confirmation_email(request):
    """Resend email confirmation link"""
    email = request.data.get('email')
    
    if not email:
        return Response(
            {'error': 'Email is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
        
        if user.email_verified:
            return Response(
                {'error': 'Email is already verified'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate new token and send email
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Send confirmation email (reusing the method from serializer)
        serializer = UserRegistrationSerializer()
        serializer.send_confirmation_email(user, uid, token)
        
        return Response({
            'message': 'Confirmation email has been resent. Please check your inbox.'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'No user found with this email address'}, 
            status=status.HTTP_404_NOT_FOUND
        )


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class SellerVerificationView(generics.CreateAPIView):
    serializer_class = SellerVerificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        if self.request.user.role != User.Role.SELLER:
            raise permissions.PermissionDenied("Only sellers can submit verification.")
        serializer.save(user=self.request.user)

# users/views.py - Temporary debug version
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_verification(request):
    print(f"Request method: {request.method}")
    print(f"Request content type: {request.content_type}")
    print(f"Request FILES: {request.FILES}")
    print(f"Request DATA: {request.data}")
    print(f"User role: {request.user.role}")
    
    if request.user.role != User.Role.BUYER:
        return Response({"error": "Only buyers can submit seller verification"}, status=status.HTTP_400_BAD_REQUEST)
    
    if hasattr(request.user, 'seller_verification'):
        return Response({"error": "Verification already submitted"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        serializer = SellerVerificationSerializer(data=request.data)
        print(f"Serializer data: {request.data}")
        print(f"Serializer is valid: {serializer.is_valid()}")
        
        if not serializer.is_valid():
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        verification = serializer.save(user=request.user)
        print(f"Verification created: {verification.id}")
        
        return Response({
            "message": "Verification submitted successfully",
            "status": verification.status,
            "submitted_at": verification.submitted_at
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        import traceback
        print(f"Error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return Response({
            "error": f"Server error: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# users/views.py
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_verification_status(request):
    try:
        verification = request.user.seller_verification
        document_url = None
        if verification.document:
            # Generate full URL to the document
            document_url = request.build_absolute_uri(verification.document.url)
        
        return Response({
            "status": verification.status,
            "submitted_at": verification.submitted_at,
            "reviewed_at": verification.reviewed_at,
            "admin_notes": verification.admin_notes if verification.admin_notes else "",
            "document_name": verification.document.name if verification.document else None,
            "document_url": document_url,  # Add the full URL
        })
    except User.seller_verification.RelatedObjectDoesNotExist:
        return Response({
            "status": "none",
            "message": "No verification submitted"
        })

# Password reset views
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({
            "message": "Password reset link has been sent to your email."
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request, uid, token):
    data = {
        'uid': uid,
        'token': token,
        'new_password': request.data.get('new_password'),
        'confirm_password': request.data.get('confirm_password')
    }
    
    serializer = PasswordResetConfirmSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response({
            "message": "Password has been reset successfully."
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)