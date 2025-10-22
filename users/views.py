from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, SellerVerification
from .serializers import (
    UserRegistrationSerializer, 
    UserProfileSerializer, 
    SellerVerificationSerializer
)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    return Response(
        {'error': 'Invalid credentials'}, 
        status=status.HTTP_401_UNAUTHORIZED
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
        # Ensure only sellers can submit verification
        if self.request.user.role != User.Role.SELLER:
            raise permissions.PermissionDenied("Only sellers can submit verification.")
        serializer.save(user=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_verification_status(request):
    """
    Check seller verification status
    """
    if request.user.role != User.Role.SELLER:
        return Response({"error": "User is not a seller"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        verification = request.user.seller_verification
        return Response({
            "status": verification.status,
            "submitted_at": verification.submitted_at,
            "reviewed_at": verification.reviewed_at,
            "admin_notes": verification.admin_notes
        })
    except User.seller_verification.RelatedObjectDoesNotExist:
        return Response({
            "status": "not_submitted",
            "message": "Please submit verification documents"
        })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_verification(request):
    """
    Submit seller verification documents
    """
    if request.user.role != User.Role.SELLER:
        return Response({"error": "User is not a seller"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if already submitted
    if hasattr(request.user, 'seller_verification'):
        return Response({"error": "Verification already submitted"}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = SellerVerificationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)