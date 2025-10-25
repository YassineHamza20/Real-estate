# users/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, SellerVerification
# REMOVE this duplicate import: from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'role', 'phone_number', 'first_name', 'last_name')
    
    def validate_username(self, value):
        """
        Check if username already exists
        """
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate_email(self, value):
        """
        Check if email already exists
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate(self, attrs):
        """
        Check if passwords match and other cross-field validations
        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match.",
                "password2": "Password fields didn't match."
            })
        
        # Validate password strength
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                "password": list(e.messages)
            })
        
        return attrs

    def create(self, validated_data):
        """
        Create user with proper error handling
        """
        validated_data.pop('password2')
        
        try:
            user = User.objects.create_user(**validated_data)
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

class UserProfileSerializer(serializers.ModelSerializer):
    verification_status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone_number', 
                 'first_name', 'last_name', 'date_joined', 'verification_status')
        read_only_fields = ('role', 'username', 'email')
    
    def get_verification_status(self, obj):
        if obj.role == User.Role.SELLER:
            try:
                return obj.seller_verification.status
            except SellerVerification.DoesNotExist:
                return 'not_submitted'
        return None

class SellerVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerVerification
        fields = '__all__'
        read_only_fields = ('user', 'submitted_at', 'reviewed_at')


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
        
        # FIXED: Update this URL to match your actual URL pattern
        reset_url = f"http://localhost:8000/api/users/password-reset-confirm/{uid}/{token}/"
        
        # Send email
        subject = "Password Reset Request"
        message = f"""
        Hello {user.username},
        
        You requested a password reset. Click the link below to reset your password:
        {reset_url}
        
        If you didn't request this, please ignore this email.
        
        Thank you,
        Your App Team
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
        # REMOVED the extra text that was here