# properties/serializers.py
from rest_framework import serializers
from .models import Property, PropertyImage
from .models import Wishlist  # Add this import

class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'is_primary', 'uploaded_at']

# ADD THIS MISSING SERIALIZER
class PropertyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = [
            'name', 'description', 'address', 'city', 
            'price', 'number_of_rooms', 'size', 'property_type'
        ]

class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    seller_email = serializers.CharField(source='seller.email', read_only=True)  # Add this
    seller_phone = serializers.CharField(source='seller.phone_number', read_only=True)  # Add this
    in_wishlist = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'name', 'description', 'address', 'city', 
            'price', 'number_of_rooms', 'size', 'property_type',
            'is_available', 'seller', 'seller_name', 'seller_email', 'seller_phone', 'images',  # Add new fields
            'in_wishlist', 'created_at', 'updated_at'
        ]
        read_only_fields = ['seller', 'created_at', 'updated_at']

    def get_in_wishlist(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Wishlist.objects.filter(user=request.user, property=obj).exists()
        return False

# Add WishlistSerializer to the same file
class WishlistSerializer(serializers.ModelSerializer):
    property_details = PropertySerializer(source='property', read_only=True)
    
    class Meta:
        model = Wishlist
        fields = ['id', 'property', 'property_details', 'created_at']
        read_only_fields = ['user', 'created_at']