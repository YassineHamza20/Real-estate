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
from rest_framework.parsers import MultiPartParser, FormParser
##ADMIN VIEWS BELOW##
from .serializers import (
    AdminUserSerializer, AdminUserCreateSerializer, AdminUserUpdateSerializer,
    AdminSellerVerificationSerializer, AdminStatsSerializer
)
from django.db import models
from django.utils import timezone

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
    parser_classes = [MultiPartParser, FormParser]  # Add this for file uploads
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_context(self):
        """Add request context to serializer for building absolute URLs"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class SellerVerificationView(generics.CreateAPIView):
    serializer_class = SellerVerificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        if self.request.user.role != User.Role.SELLER:
            raise permissions.PermissionDenied("Only sellers can submit verification.")
        serializer.save(user=self.request.user)



# users/views.py

@api_view(['POST', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def submit_verification(request):
    """
    POST  → Submit a new verification document (only buyers, no existing submission)
    DELETE → Delete the current verification document (reset to "none")
    """
    # ---------- POST: Submit new document ----------
    if request.method == 'POST':
        print(f"[POST] User: {request.user.id}, Role: {request.user.role}")

        if request.user.role != User.Role.BUYER:
            return Response(
                {"error": "Only buyers can submit verification"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if hasattr(request.user, 'seller_verification'):
            return Response(
                {"error": "Verification already submitted"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            serializer = SellerVerificationSerializer(data=request.data, context={'request': request})
            if not serializer.is_valid():
                print(f"Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            verification = serializer.save(user=request.user)
            document_url = request.build_absolute_uri(verification.document.url) if verification.document else None

            return Response({
                "message": "Verification submitted successfully",
                "status": verification.status,
                "submitted_at": verification.submitted_at,
                "document_name": verification.document.name if verification.document else None,
                "document_url": document_url
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            print(f"Error: {str(e)}\n{traceback.format_exc()}")
            return Response(
                {"error": f"Server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ---------- DELETE: Remove existing document ----------
    elif request.method == 'DELETE':
        print(f"[DELETE] User: {request.user.id} attempting to delete verification")

        if request.user.role != User.Role.BUYER:
            return Response(
                {"error": "Only buyers can delete their verification"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            verification = request.user.seller_verification
        except User.seller_verification.RelatedObjectDoesNotExist:
            return Response(
                {"error": "No verification document to delete"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delete file from storage
        if verification.document:
            verification.document.delete(save=False)  # Remove file

        # Delete DB record
        verification.delete()

        return Response({
            "message": "Verification document deleted successfully",
            "status": "none"
        }, status=status.HTTP_200_OK)

    
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


 
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_seller_contact_info(request, seller_id):
    """Get seller contact information for authenticated users"""
    try:
        seller = User.objects.get(id=seller_id, role=User.Role.SELLER)
        
        # Return basic contact info
        return Response({
            "id": seller.id,
            "name": seller.username,
             "first_name": seller.first_name,  # Add these
            "last_name": seller.last_name,    # Add the
            "email": seller.email,
            "phone": seller.phone_number,
            "is_verified": hasattr(seller, 'seller_verification') and 
                          seller.seller_verification.status == 'approved'
        })
    except User.DoesNotExist:
        return Response({"error": "Seller not found"}, status=status.HTTP_404_NOT_FOUND)
    



# Add these to your existing users/views.py

from .serializers import (
    AdminUserSerializer, AdminUserCreateSerializer, AdminUserUpdateSerializer,
    AdminSellerVerificationSerializer, AdminStatsSerializer
)

# Admin Permissions
class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users to access the view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.ADMIN

# Admin User Management Views
class AdminUserListView(generics.ListCreateAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search by username, email, first name, last name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(username__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search)
            )
        
        return queryset
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminUserCreateSerializer
        return AdminUserSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    lookup_field = 'id'
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AdminUserUpdateSerializer
        return AdminUserSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_destroy(self, instance):
        # Soft delete by deactivating the user instead of actually deleting
        instance.is_active = False
        instance.save()

# Admin Seller Verification Management
class AdminSellerVerificationListView(generics.ListAPIView):
    serializer_class = AdminSellerVerificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = SellerVerification.objects.all().select_related('user').order_by('-submitted_at')
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset

class AdminSellerVerificationDetailView(generics.RetrieveUpdateAPIView):
    queryset = SellerVerification.objects.all()
    serializer_class = AdminSellerVerificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    lookup_field = 'id'
    
    def perform_update(self, serializer):
        instance = serializer.save()
        
        # If status is changed to approved, update user role to seller
        if (serializer.validated_data.get('status') == 
            SellerVerification.VerificationStatus.APPROVED and 
            instance.user.role != User.Role.SELLER):
            
            instance.user.role = User.Role.SELLER
            instance.user.save()
        
        # Set reviewed_at timestamp
        if 'status' in serializer.validated_data:
            instance.reviewed_at = timezone.now()
            instance.save()

################################## Admin Dashboard Stats
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_dashboard_stats(request):
    """Get dashboard statistics for admin"""
    total_users = User.objects.count()
    total_buyers = User.objects.filter(role=User.Role.BUYER).count()
    total_sellers = User.objects.filter(role=User.Role.SELLER).count()
    total_admins = User.objects.filter(role=User.Role.ADMIN).count()
    
    pending_verifications = SellerVerification.objects.filter(
        status=SellerVerification.VerificationStatus.PENDING
    ).count()
    approved_verifications = SellerVerification.objects.filter(
        status=SellerVerification.VerificationStatus.APPROVED
    ).count()
    rejected_verifications = SellerVerification.objects.filter(
        status=SellerVerification.VerificationStatus.REJECTED
    ).count()
    
    stats = {
        'total_users': total_users,
        'total_buyers': total_buyers,
        'total_sellers': total_sellers,
        'total_admins': total_admins,
        'pending_verifications': pending_verifications,
        'approved_verifications': approved_verifications,
        'rejected_verifications': rejected_verifications,
    }
    
    serializer = AdminStatsSerializer(stats)
    return Response(serializer.data)

# Bulk actions for admin
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_bulk_user_actions(request):
    """Bulk actions for users (activate, deactivate, delete)"""
    user_ids = request.data.get('user_ids', [])
    action = request.data.get('action')
    
    if not user_ids or not action:
        return Response(
            {'error': 'user_ids and action are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    users = User.objects.filter(id__in=user_ids)
    
    if action == 'activate':
        users.update(is_active=True)
        message = f'{users.count()} users activated successfully'
    elif action == 'deactivate':
        users.update(is_active=False)
        message = f'{users.count()} users deactivated successfully'
    elif action == 'delete':
        # Soft delete
        users.update(is_active=False)
        message = f'{users.count()} users deleted successfully'
    else:
        return Response(
            {'error': 'Invalid action. Use activate, deactivate, or delete'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response({'message': message})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_bulk_verification_actions(request):
    """Bulk actions for seller verifications (approve, reject)"""
    verification_ids = request.data.get('verification_ids', [])
    action = request.data.get('action')
    admin_notes = request.data.get('admin_notes', '')
    
    if not verification_ids or not action:
        return Response(
            {'error': 'verification_ids and action are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    verifications = SellerVerification.objects.filter(id__in=verification_ids)
    
    if action == 'approve':
        for verification in verifications:
            verification.status = SellerVerification.VerificationStatus.APPROVED
            verification.reviewed_at = timezone.now()
            verification.admin_notes = admin_notes
            verification.save()
            
            # Update user role to seller
            user = verification.user
            user.role = User.Role.SELLER
            user.save()
        
        message = f'{verifications.count()} verifications approved successfully'
    
    elif action == 'reject':
        verifications.update(
            status=SellerVerification.VerificationStatus.REJECTED,
            reviewed_at=timezone.now(),
            admin_notes=admin_notes
        )
        message = f'{verifications.count()} verifications rejected successfully'
    
    else:
        return Response(
            {'error': 'Invalid action. Use approve or reject'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response({'message': message})

 

class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    lookup_field = 'id'
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AdminUserUpdateSerializer
        return AdminUserSerializer

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_user_full_detail(request, user_id):
    """Get complete user details including verification info"""
    try:
        user = User.objects.get(id=user_id)
        
        # Get verification details if user is a seller
        verification_data = None
        if user.role == User.Role.SELLER:
            try:
                verification = SellerVerification.objects.get(user=user)
                verification_data = AdminSellerVerificationSerializer(verification).data
            except SellerVerification.DoesNotExist:
                verification_data = None
        
        user_data = AdminUserSerializer(user).data
        user_data['verification_details'] = verification_data
        
        return Response(user_data)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)