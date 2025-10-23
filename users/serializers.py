# users/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, SellerVerification

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'role', 'phone_number')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    verification_status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone_number', 
                 'first_name', 'last_name', 'date_joined', 'verification_status')
        read_only_fields = ('role', 'username', 'email')  # ← ADD THIS LINE
    
    def get_verification_status(self, obj):
        if obj.role == User.Role.SELLER:
            try:
                return obj.seller_verification.status
            except User.seller_verification.RelatedObjectDoesNotExist:
                return 'not_submitted'
        return None

class SellerVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerVerification
        fields = '__all__'
        read_only_fields = ('user', 'submitted_at', 'reviewed_at')