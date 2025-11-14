from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
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
        """Return the profile picture URL or a default avatar"""
        if self.profile_picture and hasattr(self.profile_picture, 'url'):
            return self.profile_picture.url
        return None

# users/models.py
class SellerVerification(models.Model):
    class VerificationStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seller_verification')
    document = models.FileField(upload_to='verification_docs/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.PENDING)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.status}"
    

# Add date_joined property for compatibility
    @property
    def date_joined(self):
        """Compatibility property - use created_at"""
        return self.created_at