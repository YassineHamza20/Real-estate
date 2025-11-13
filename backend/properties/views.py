# properties/views.py
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Property, PropertyImage
from .serializers import PropertySerializer, PropertyCreateSerializer, PropertyImageSerializer,WishlistSerializer
from .permissions import IsVerifiedSellerOrReadOnly, IsPropertyOwnerOrReadOnly, IsVerifiedSeller
from .models import Property, PropertyImage, Wishlist  # Add Wishlist
 # Add WishlistSerializer
 ###Admin
from rest_framework.permissions import IsAdminUser
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
class PropertyListCreateView(generics.ListCreateAPIView):
    queryset = Property.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['property_type', 'city', 'number_of_rooms', 'is_available']
    search_fields = ['name', 'description', 'address', 'city']
    ordering_fields = ['price', 'created_at', 'size']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsVerifiedSellerOrReadOnly()]
        return [permissions.AllowAny()]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PropertyCreateSerializer
        return PropertySerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsPropertyOwnerOrReadOnly]

class UserPropertiesView(generics.ListAPIView):
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Property.objects.filter(seller=self.request.user)

class PropertyImageView(generics.CreateAPIView):
    queryset = PropertyImage.objects.all()
    serializer_class = PropertyImageSerializer
    permission_classes = [permissions.IsAuthenticated, IsVerifiedSeller, IsPropertyOwnerOrReadOnly]
    
    def perform_create(self, serializer):
        property_id = self.kwargs['property_id']
        property_obj = Property.objects.get(id=property_id)
        # Check if user owns the property
        if property_obj.seller != self.request.user:
            raise permissions.PermissionDenied("You don't own this property")
        serializer.save(property=property_obj)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def property_filters(request):
    """
    Get available filter options for properties
    """
    cities = Property.objects.values_list('city', flat=True).distinct()
    property_types = Property.objects.values_list('property_type', flat=True).distinct()
    
    return Response({
        'cities': list(cities),
        'property_types': list(property_types),
        'room_options': [1, 2, 3, 4, 5, 6],
    })


class WishlistListView(generics.ListCreateAPIView):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).select_related('property')

    def perform_create(self, serializer):
        property_id = self.request.data.get('property')
        # Check if property exists
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise serializers.ValidationError({"error": "Property not found"})
        
        # Check if already in wishlist
        if Wishlist.objects.filter(user=self.request.user, property=property_obj).exists():
            raise serializers.ValidationError({"error": "Property is already in your wishlist"})
        
        serializer.save(user=self.request.user, property=property_obj)

class WishlistDetailView(generics.DestroyAPIView):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Wishlist.objects.all()

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_wishlist(request, property_id):
    """
    Toggle property in wishlist - add if not exists, remove if exists
    """
    try:
        property_obj = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return Response({"error": "Property not found"}, status=status.HTTP_404_NOT_FOUND)

    wishlist_item = Wishlist.objects.filter(user=request.user, property=property_obj).first()
    
    if wishlist_item:
        wishlist_item.delete()
        return Response({
            "message": "Removed from wishlist", 
            "in_wishlist": False,
            "action": "removed"
        })
    else:
        Wishlist.objects.create(user=request.user, property=property_obj)
        return Response({
            "message": "Added to wishlist", 
            "in_wishlist": True,
            "action": "added"
        })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_wishlist_status(request, property_id):
    """
    Check if a property is in user's wishlist
    """
    try:
        property_obj = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return Response({"error": "Property not found"}, status=status.HTTP_404_NOT_FOUND)

    in_wishlist = Wishlist.objects.filter(user=request.user, property=property_obj).exists()
    
    return Response({
        "property_id": property_id,
        "in_wishlist": in_wishlist
    })


 # properties/views.py
class PropertyImageListView(generics.ListCreateAPIView):
    serializer_class = PropertyImageSerializer
    permission_classes = [permissions.IsAuthenticated, IsPropertyOwnerOrReadOnly]

    def get_queryset(self):
        property_id = self.kwargs['property_id']
        return PropertyImage.objects.filter(property_id=property_id)

    def perform_create(self, serializer):
        property_id = self.kwargs['property_id']
        property_obj = Property.objects.get(id=property_id)
        # Check if user owns the property - compare IDs, not objects
        if property_obj.seller.id != self.request.user.id:
            raise permissions.PermissionDenied("You don't own this property")
        serializer.save(property=property_obj)



# properties/views.py
class PropertyImageDetailView(generics.DestroyAPIView):
    serializer_class = PropertyImageSerializer
    permission_classes = [permissions.IsAuthenticated, IsPropertyOwnerOrReadOnly]
    
    def get_queryset(self):
        return PropertyImage.objects.filter(property__seller=self.request.user)

    def get_object(self):
        queryset = self.get_queryset()
        obj = generics.get_object_or_404(queryset, pk=self.kwargs['pk'])
        return obj

    def perform_destroy(self, instance):
        # Delete the actual file from storage
        if instance.image:
            instance.image.delete()
        instance.delete()


########ADMINN###
# properties/views.py - Add these imports at the top


# Add these admin views after your existing views
class AdminPropertyListView(generics.ListAPIView):
    """
    Admin view to list all properties with advanced filtering
    """
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['property_type', 'city', 'number_of_rooms', 'is_available', 'seller']
    search_fields = ['name', 'description', 'address', 'city', 'seller__username', 'seller__email']
    ordering_fields = ['price', 'created_at', 'size', 'number_of_rooms']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Property.objects.all().select_related('seller').prefetch_related('images')
        
        # Additional filters for admin
        status_filter = self.request.query_params.get('status', None)
        if status_filter == 'active':
            queryset = queryset.filter(is_available=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(is_available=False)
            
        return queryset

class AdminPropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin view to retrieve, update, or delete any property
    """
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def perform_update(self, serializer):
        # Admin can update any property without ownership check
        serializer.save()

    def perform_destroy(self, instance):
        # Delete associated images
        instance.images.all().delete()
        instance.delete()

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_property_stats(request):
    """
    Get statistics for admin dashboard
    """
    total_properties = Property.objects.count()
    active_properties = Property.objects.filter(is_available=True).count()
    properties_by_type = Property.objects.values('property_type').annotate(count=Count('id'))
    properties_by_city = Property.objects.values('city').annotate(count=Count('id')).order_by('-count')[:10]
    
    # Recent properties (last 7 days)
    from django.utils import timezone
    from datetime import timedelta
    week_ago = timezone.now() - timedelta(days=7)
    recent_properties = Property.objects.filter(created_at__gte=week_ago).count()
    
    # Top sellers
    top_sellers = get_user_model().objects.annotate(
        property_count=Count('properties')
    ).filter(property_count__gt=0).order_by('-property_count')[:5]
    
    top_sellers_data = [
        {
            'username': seller.username,
            'email': seller.email,
            'property_count': seller.property_count
        }
        for seller in top_sellers
    ]
    
    return Response({
        'total_properties': total_properties,
        'active_properties': active_properties,
        'inactive_properties': total_properties - active_properties,
        'recent_properties': recent_properties,
        'properties_by_type': list(properties_by_type),
        'top_cities': list(properties_by_city),
        'top_sellers': top_sellers_data
    })

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_bulk_property_action(request):
    """
    Bulk actions for properties (activate, deactivate, delete)
    """
    property_ids = request.data.get('property_ids', [])
    action = request.data.get('action')  # 'activate', 'deactivate', 'delete'
    
    if not property_ids:
        return Response({"error": "No property IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
    
    if action not in ['activate', 'deactivate', 'delete']:
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
    
    properties = Property.objects.filter(id__in=property_ids)
    
    if action == 'activate':
        properties.update(is_available=True)
        message = f"Activated {properties.count()} properties"
    elif action == 'deactivate':
        properties.update(is_available=False)
        message = f"Deactivated {properties.count()} properties"
    elif action == 'delete':
        count = properties.count()
        # Delete associated images first
        for property_obj in properties:
            property_obj.images.all().delete()
        properties.delete()
        message = f"Deleted {count} properties"
    
    return Response({"message": message})

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_property_filters(request):
    """
    Get enhanced filter options for admin
    """
    cities = Property.objects.values_list('city', flat=True).distinct()
    property_types = Property.objects.values_list('property_type', flat=True).distinct()
    sellers = get_user_model().objects.filter(properties__isnull=False).distinct().values('id', 'username')
    
    # Price ranges for filtering
    price_stats = Property.objects.aggregate(
        min_price=models.Min('price'),
        max_price=models.Max('price'),
        avg_price=models.Avg('price')
    )
    
    return Response({
        'cities': list(cities),
        'property_types': list(property_types),
        'sellers': list(sellers),
        'price_ranges': {
            'min': price_stats['min_price'] or 0,
            'max': price_stats['max_price'] or 0,
            'avg': price_stats['avg_price'] or 0
        },
        'room_options': [1, 2, 3, 4, 5, 6],
    })