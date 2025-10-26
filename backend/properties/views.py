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