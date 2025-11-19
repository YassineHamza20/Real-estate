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
from rest_framework.permissions import AllowAny , IsAdminUser
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
from django.db.models import Count
from .models import SellerVerification

 





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
    
####admin verification




@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_verifications_list(request):
    status_filter = request.GET.get('status', 'all')
    
    queryset = SellerVerification.objects.select_related('user').all()
    
    if status_filter != 'all':
        queryset = queryset.filter(status=status_filter)
    
    verifications = []
    for verification in queryset:
        # Build user data with proper fallbacks and correct field names
        user_data = {
            'id': verification.user.id,
            'username': verification.user.username,
            'email': verification.user.email,
            'role': verification.user.role,
            'profile_picture': verification.user.profile_picture.url if verification.user.profile_picture else None,
            'profile_picture_url': verification.user.profile_picture.url if verification.user.profile_picture else None,
            'phone_number': verification.user.phone_number or 'Not provided',
            'created_at': verification.user.created_at.isoformat(),  # Use created_at
            'date_joined': verification.user.created_at.isoformat(),  # Add date_joined for compatibility
        }
        
        verifications.append({
            'id': verification.id,
            'user': user_data,
            'document': verification.document.url if verification.document else None,
            'status': verification.status,
            'submitted_at': verification.submitted_at.isoformat(),
            'reviewed_at': verification.reviewed_at.isoformat() if verification.reviewed_at else None,
            'admin_notes': verification.admin_notes or '',
        })
    
    return Response(verifications)



@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_verifications_stats(request):
    stats = SellerVerification.objects.aggregate(
        total_verifications=Count('id'),
        pending_verifications=Count('id', filter=models.Q(status='pending')),
        approved_verifications=Count('id', filter=models.Q(status='approved')),
        rejected_verifications=Count('id', filter=models.Q(status='rejected')),
    )
    return Response(stats)

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_verification_detail(request, pk):
    try:
        verification = SellerVerification.objects.get(pk=pk)
    except SellerVerification.DoesNotExist:
        return Response({'detail': 'Verification not found'}, status=404)
    
    status = request.data.get('status')
    admin_notes = request.data.get('admin_notes', '')
    
    if status and status in ['approved', 'rejected']:
        verification.status = status
        verification.reviewed_at = timezone.now()
        verification.admin_notes = admin_notes
        verification.save()
        
        # Update user role if approved
        if status == 'approved':
            verification.user.role = 'seller'
            verification.user.save()
    
    return Response({
        'id': verification.id,
        'user': {
            'id': verification.user.id,
            'username': verification.user.username,
            'email': verification.user.email,
            'role': verification.user.role,
        },
        'status': verification.status,
        'submitted_at': verification.submitted_at.isoformat(),
        'reviewed_at': verification.reviewed_at.isoformat() if verification.reviewed_at else None,
        'admin_notes': verification.admin_notes,
    })

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_verifications_bulk_action(request):
    verification_ids = request.data.get('verification_ids', [])
    action = request.data.get('action')  # 'approve' or 'reject'
    
    if not verification_ids or action not in ['approve', 'reject']:
        return Response({'detail': 'Invalid request'}, status=400)
    
    verifications = SellerVerification.objects.filter(id__in=verification_ids)
    updated_count = 0
    
    for verification in verifications:
        if action == 'approve' and verification.status != 'approved':
            verification.status = 'approved'
            verification.user.role = 'seller'
            verification.user.save()
            updated_count += 1
        elif action == 'reject' and verification.status != 'rejected':
            verification.status = 'rejected'
            updated_count += 1
        
        verification.reviewed_at = timezone.now()
        verification.save()
    
    return Response({'detail': f'{updated_count} verifications updated'})




# users/views.py - Add these analytics views
from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from properties.models import Property, PropertyImage, Wishlist

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_analytics(request):
    """Comprehensive analytics data for admin dashboard"""
    try:
        # Get time range from query params
        time_range = request.GET.get('period', '30d')
        
        # Calculate date range
        end_date = timezone.now()
        if time_range == '7d':
            start_date = end_date - timedelta(days=7)
        elif time_range == '90d':
            start_date = end_date - timedelta(days=90)
        elif time_range == '1y':
            start_date = end_date - timedelta(days=365)
        else:  # 30d default
            start_date = end_date - timedelta(days=30)

        # User analytics
        total_users = User.objects.count()
        total_buyers = User.objects.filter(role=User.Role.BUYER).count()
        total_sellers = User.objects.filter(role=User.Role.SELLER).count()
        new_users = User.objects.filter(date_joined__gte=start_date).count()
        
        # Calculate user growth rate
        previous_period_users = User.objects.filter(
            date_joined__lt=start_date
        ).count()
        user_growth_rate = ((total_users - previous_period_users) / previous_period_users * 100) if previous_period_users > 0 else 0

        # Property analytics
        total_properties = Property.objects.count()
        active_properties = Property.objects.filter(is_available=True).count()
        new_properties = Property.objects.filter(created_at__gte=start_date).count()
        
        # Property views (you'll need to implement view tracking)
        total_property_views = 0  # Placeholder - implement view tracking
        
        # Calculate conversion rate (inquiries/views)
        conversion_rate = 0  # Placeholder - implement inquiry tracking
        
        # Revenue analytics (placeholder - implement your revenue logic)
        total_revenue = 0
        revenue_growth_rate = 0
        
        # Engagement analytics
        total_wishlist_items = Wishlist.objects.count()
        new_wishlist_items = Wishlist.objects.filter(created_at__gte=start_date).count()
        
        # User demographics
        top_locations = Property.objects.values('city').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        # Top performing properties
        top_properties = Property.objects.annotate(
            wishlist_count=Count('wishlisted_by')
        ).order_by('-wishlist_count')[:5]
        
        analytics_data = {
            'period': f"Last {time_range}",
            'userGrowth': {
                'total': total_users,
                'newUsers': new_users,
                'growthRate': round(user_growth_rate, 1),
                'trend': 'up' if user_growth_rate > 0 else 'down' if user_growth_rate < 0 else 'stable'
            },
            'propertyMetrics': {
                'total': total_properties,
                'active': active_properties,
                'views': total_property_views,
                'conversionRate': conversion_rate
            },
            'revenue': {
                'total': total_revenue,
                'projected': total_revenue * 1.1,  # Simple projection
                'growthRate': revenue_growth_rate,
                'trend': 'up' if revenue_growth_rate > 0 else 'down' if revenue_growth_rate < 0 else 'stable'
            },
            'engagement': {
                'avgSessionDuration': 4.2,  # Placeholder - implement analytics
                'bounceRate': 32.1,  # Placeholder
                'wishlistAdds': total_wishlist_items,
                'pageViews': total_property_views
            },
            'topProperties': [
                {
                    'id': str(prop.id),
                    'name': prop.name,
                    'views': prop.wishlist_count * 10,  # Estimate views from wishlists
                    'wishlists': prop.wishlist_count,
                    'inquiries': prop.wishlist_count // 2,  # Estimate inquiries
                    'conversionRate': round((prop.wishlist_count // 2) / (prop.wishlist_count * 10) * 100, 1) if prop.wishlist_count > 0 else 0
                }
                for prop in top_properties
            ],
            'userDemographics': {
                'buyers': total_buyers,
                'sellers': total_sellers,
                'verifiedSellers': SellerVerification.objects.filter(status='approved').count(),
                'topLocations': [
                    {
                        'city': loc['city'],
                        'users': loc['count'],
                        'percentage': round((loc['count'] / total_properties) * 100, 1)
                    }
                    for loc in top_locations
                ]
            }
        }
        
        return Response(analytics_data)
        
    except Exception as e:
        print(f"Analytics error: {str(e)}")
        return Response(
            {'error': 'Failed to generate analytics data'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_property_analytics(request):
    """Detailed property analytics"""
    try:
        # Property statistics
        properties_by_type = Property.objects.values('property_type').annotate(
            count=Count('id'),
            avg_price=Avg('price'),
            avg_size=Avg('size')
        )
        
        properties_by_city = Property.objects.values('city').annotate(
            count=Count('id'),
            avg_price=Avg('price')
        ).order_by('-count')[:10]
        
        # Price statistics
        price_stats = Property.objects.aggregate(
            min_price=Avg('price'),
            max_price=Avg('price'),
            avg_price=Avg('price')
        )
        
        # Recent activity
        week_ago = timezone.now() - timedelta(days=7)
        recent_properties = Property.objects.filter(created_at__gte=week_ago).count()
        
        property_data = {
            'byType': list(properties_by_type),
            'byCity': list(properties_by_city),
            'priceStats': price_stats,
            'recentActivity': {
                'newProperties': recent_properties,
                'updatedProperties': Property.objects.filter(updated_at__gte=week_ago).count()
            }
        }
        
        return Response(property_data)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to fetch property analytics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_user_analytics(request):
    """Detailed user analytics"""
    try:
        # User growth over time
        user_growth = User.objects.extra({
            'date': "date(date_joined)"
        }).values('date').annotate(
            count=Count('id')
        ).order_by('date')[-30:]  # Last 30 days
        
        # User role distribution
        role_distribution = User.objects.values('role').annotate(
            count=Count('id')
        )
        
        # User activity
        active_users = User.objects.filter(
            last_login__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        user_data = {
            'growthTimeline': list(user_growth),
            'roleDistribution': list(role_distribution),
            'activity': {
                'activeUsers': active_users,
                'totalUsers': User.objects.count(),
                'newUsersThisMonth': User.objects.filter(
                    date_joined__gte=timezone.now() - timedelta(days=30)
                ).count()
            }
        }
        
        return Response(user_data)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to fetch user analytics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

 
 

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_create_user(request):
    """
    Admin endpoint to create new users with email verification control
    Only accessible by admin users
    """
    serializer = AdminUserCreateSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            user = serializer.save()
            return Response({
                'message': 'User created successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone_number': user.phone_number,
                    'is_active': user.is_active,
                    'is_staff': user.is_staff,
                    'email_verified': user.email_verified,  # Include verification status
                    'date_joined': user.date_joined
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': f'Error creating user: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



 
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

@api_view(['DELETE'])
@permission_classes([permissions.IsAdminUser])
def admin_delete_user(request, user_id):
    """
    Admin endpoint to delete users
    Only accessible by admin users
    """
    try:
        # Prevent admin from deleting themselves
        if request.user.id == user_id:
            return Response({
                'error': 'You cannot delete your own account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user_to_delete = User.objects.get(id=user_id)
        
        # Prevent deletion of superusers by non-superusers
        if user_to_delete.is_superuser and not request.user.is_superuser:
            return Response({
                'error': 'Only superusers can delete other superusers'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Store user info for the response before deletion
        user_info = {
            'id': user_to_delete.id,
            'username': user_to_delete.username,
            'email': user_to_delete.email,
            'role': user_to_delete.role
        }
        
        # Use transaction to ensure data consistency
        with transaction.atomic():
            user_to_delete.delete()
        
        return Response({
            'message': 'User deleted successfully',
            'deleted_user': user_info
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Error deleting user: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile_picture(request, user_id):
    """
    Get user profile picture URL
    Allow users to see profile pictures of property sellers
    """
    try:
        user = User.objects.get(id=user_id)
        
        # Allow access if:
        # 1. User is viewing their own picture
        # 2. User is admin
        # 3. User is viewing a seller's picture (for property pages)
        if (request.user.id != user_id and 
            request.user.role != User.Role.ADMIN and
            user.role != User.Role.SELLER):
            return Response(
                {"error": "You don't have permission to view this user's profile picture"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        profile_picture_url = None
        if user.profile_picture:
            profile_picture_url = request.build_absolute_uri(user.profile_picture.url)
        
        return Response({
            "user_id": user_id,
            "profile_picture_url": profile_picture_url,
            "has_profile_picture": bool(user.profile_picture)
        })
        
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)



@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_my_profile_picture(request):
    """
    Get current user's profile picture
    """
    profile_picture_url = None
    if request.user.profile_picture:
        profile_picture_url = request.build_absolute_uri(request.user.profile_picture.url)
    
    return Response({
        "user_id": request.user.id,
        "profile_picture_url": profile_picture_url,
        "has_profile_picture": bool(request.user.profile_picture)
    })