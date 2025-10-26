# properties/permissions.py
from rest_framework import permissions
from users.models import User

class IsVerifiedSellerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow verified sellers to create/edit properties.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to verified sellers
        if request.user.is_authenticated and request.user.role == User.Role.SELLER:
            # Check if seller is verified
            try:
                return request.user.seller_verification.status == 'approved'
            except User.seller_verification.RelatedObjectDoesNotExist:
                return False
        return False

class IsPropertyOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of a property to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner of the property
        return obj.seller == request.user

class IsVerifiedSeller(permissions.BasePermission):
    """
    Permission to check if user is a verified seller.
    """
    def has_permission(self, request, view):
        if request.user.is_authenticated and request.user.role == User.Role.SELLER:
            try:
                return request.user.seller_verification.status == 'approved'
            except User.seller_verification.RelatedObjectDoesNotExist:
                return False
        return False