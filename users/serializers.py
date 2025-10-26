# users/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, SellerVerification
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.urls import reverse


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'role', 'phone_number', 'first_name', 'last_name')
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match.",
                "password2": "Password fields didn't match."
            })
        
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                "password": list(e.messages)
            })
        
        return attrs

    def create(self, validated_data):
        """
        Create user but set as inactive until email is confirmed
        """
        validated_data.pop('password2')
        
        try:
            # Create user but set as inactive and email not verified
            user = User.objects.create_user(**validated_data)
            user.is_active = False  # User cannot login until email confirmed
            user.email_verified = False
            user.save()
            
            # Generate email confirmation token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Send confirmation email
            self.send_confirmation_email(user, uid, token)
            
            return user
        except IntegrityError as e:
            if 'username' in str(e):
                raise serializers.ValidationError({
                    "username": ["A user with this username already exists."]
                })
            elif 'email' in str(e):
                raise serializers.ValidationError({
                    "email": ["A user with this email already exists."]
                })
            else:
                raise serializers.ValidationError({
                    "non_field_errors": ["An error occurred while creating the user."]
                })
        except Exception as e:
            raise serializers.ValidationError({
                "non_field_errors": [f"An unexpected error occurred: {str(e)}"]
            })
    
    def send_confirmation_email(self, user, uid, token):
        """Send email confirmation link to user"""
        # Update this URL to match your frontend or backend URL
        confirmation_url = f"{settings.FRONTEND_URL}/confirm-email/{uid}/{token}/"
        
        subject = "Confirm Your Email Address"
        message = f"""
       Hello {user.username},

Welcome to Real Estate Team!

Thank you for registering with us. To complete your registration and activate your account, please confirm your email address by clicking the link below:

{confirmation_url}

This confirmation link will expire in 1 hours for your security.

If you're having trouble clicking the link, you can copy and paste the entire URL into your browser's address bar.

If you didn't create an account with us, please disregard this email - no action is needed.

Best regards,
Your Real Estate Team
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

# users/serializers.py - Add this to your existing file
class EmailConfirmationSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    
    def validate(self, data):
        try:
            uid = urlsafe_base64_decode(data['uid']).decode()
            self.user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError({"uid": "Invalid user ID"})
        
        if not default_token_generator.check_token(self.user, data['token']):
            raise serializers.ValidationError({"token": "Invalid or expired token"})
        
        return data
    
    def save(self):
        """Activate user and set email as verified"""
        self.user.is_active = True
        self.user.email_verified = True
        self.user.save()




class UserProfileSerializer(serializers.ModelSerializer):
    verification_status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone_number', 
                 'first_name', 'last_name', 'date_joined', 'verification_status', 
                 'email_verified', 'is_active')
        read_only_fields = ('role', 'username', 'email', 'email_verified', 'is_active')
    
    def get_verification_status(self, obj):
        if obj.role == User.Role.SELLER:
            try:
                return obj.seller_verification.status
            except SellerVerification.DoesNotExist:
                return 'not_submitted'
        return None

# users/serializers.py
class SellerVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerVerification
        fields = ['id', 'document', 'status', 'submitted_at', 'reviewed_at', 'admin_notes']
        read_only_fields = ['id', 'status', 'submitted_at', 'reviewed_at', 'admin_notes']


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            self.user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with this email address.")
        return value
    
    def save(self):
        user = self.user
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # FIX: Point to your FRONTEND reset password page, not the backend API
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
        
        subject = "Password Reset Request"
        message = f"""
       Hello {user.username},

We received a request to reset your password for your Real Estate Team account. To create a new password, please click the link below:

{reset_url}

This password reset link will expire in 24 hours for your security.

If you're having trouble clicking the link, you can copy and paste the entire URL into your browser's address bar.

If you didn't request a password reset, please disregard this email - your account remains secure and no action is needed.

Best regards,
Your Real Estate Team
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        try:
            uid = urlsafe_base64_decode(data['uid']).decode()
            self.user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError({"uid": "Invalid user ID"})
        
        if not default_token_generator.check_token(self.user, data['token']):
            raise serializers.ValidationError({"token": "Invalid or expired token"})
        
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match"})
        
        return data
    
    def save(self):
        self.user.set_password(self.validated_data['new_password'])
        self.user.save()



 