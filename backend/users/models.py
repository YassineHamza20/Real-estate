from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    """
    Custom User model extending Django's built-in AbstractUser.
    Adds role-based permissions, profile fields, and custom attributes.
    """
    class Role(models.TextChoices):
        BUYER = 'buyer', _('Buyer')
        SELLER = 'seller', _('Seller')
        ADMIN = 'admin', _('Admin')
    
    role = models.CharField(
        max_length=10,
        choices=Role.choices,  
        default=Role.BUYER
    )
    phone_number = models.CharField(max_length=15, blank=True)
    email_verified = models.BooleanField(default=False)
    
    # Add profile picture field
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        null=True,
        blank=True,
        help_text=_('Upload a profile picture')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
    
    @property
    def profile_picture_url(self):
        """
        Property method that returns the profile picture URL or None.
        This provides a safe way to access the image URL without checking existence.
        """
        if self.profile_picture and hasattr(self.profile_picture, 'url'):
            return self.profile_picture.url
        return None

# users/models.py
class SellerVerification(models.Model):
    """
    Model for tracking seller verification status and documents.
    Used when a user with 'seller' role needs to submit verification documents.
    """
    class VerificationStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

 # One-to-one relationship: each user can have only one verification record
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seller_verification')

    # Uploaded verification document (ID, business license, etc.)
    document = models.FileField(upload_to='verification_docs/', null=True, blank=True)

    # Current verification status
    status = models.CharField(max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.PENDING)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)

    def __str__(self):
        """
        String representation showing user and verification status.
        """
        return f"{self.user.username} - {self.status}"
    

# Add date_joined property for compatibility
    @property
    def date_joined(self):
        """
        Compatibility property that returns created_at.
        Some third-party packages or templates might expect 'date_joined' field.
        This provides backward compatibility with standard Django User model.
        """
        return self.created_at