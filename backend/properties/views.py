# properties/views.py
from rest_framework import generics, permissions, status,filters,serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
 # properties/views.py - Add this import at the top
from users.models import User  # Add this import
from django.db import models  # Add this import
from .models import Property, PropertyImage
from .serializers import PropertySerializer, PropertyCreateSerializer, PropertyImageSerializer,WishlistSerializer
from .permissions import IsVerifiedSellerOrReadOnly, IsPropertyOwnerOrReadOnly, IsVerifiedSeller
from .models import Property, PropertyImage, Wishlist  # Add Wishlist
 # Add WishlistSerializer
 ###Admin
from rest_framework.permissions import IsAdminUser
 # properties/views.py - Add this import at the top
 # properties/views.py - Add these analytics views
from django.db.models import Count, Avg, Q, F, Sum
 
from django.contrib.auth import get_user_model

 
 
 # Add these imports at the top if not already there
 
from django.utils import timezone
from datetime import timedelta



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


# properties/views.py - Fix the WishlistListView
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
            # Add the import for serializers at the top of your file
            from rest_framework import serializers
            raise serializers.ValidationError({"error": "Property not found"})
        
        # Check if already in wishlist
        if Wishlist.objects.filter(user=self.request.user, property=property_obj).exists():
            from rest_framework import serializers
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


# properties/views.py - Update PropertyImageListView
class PropertyImageListView(generics.ListCreateAPIView):
    serializer_class = PropertyImageSerializer
    permission_classes = [permissions.IsAuthenticated, IsPropertyOwnerOrReadOnly]

    def get_queryset(self):
        property_id = self.kwargs['property_id']
        return PropertyImage.objects.filter(property_id=property_id)

    def perform_create(self, serializer):
        property_id = self.kwargs['property_id']
        property_obj = Property.objects.get(id=property_id)
        
        # Check if user owns the property
        if property_obj.seller.id != self.request.user.id:
            raise permissions.PermissionDenied("You don't own this property")
        
        # Check if this should be primary image
        is_primary = serializer.validated_data.get('is_primary', False)
        
        # If setting as primary, remove primary status from other images
        if is_primary:
            PropertyImage.objects.filter(property=property_obj, is_primary=True).update(is_primary=False)
        # If no images exist yet, make this primary by default
        elif not PropertyImage.objects.filter(property=property_obj).exists():
            is_primary = True
        
        serializer.save(property=property_obj, is_primary=is_primary)



# properties/views.py
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsPropertyOwnerOrReadOnly])
def set_primary_image(request, property_id, image_id):
    """
    Set an image as primary for a property (for property owners)
    """
    try:
        # Verify the property exists and user owns it
        property_obj = Property.objects.get(id=property_id)
        if property_obj.seller != request.user:
            return Response({"error": "You don't own this property"}, status=status.HTTP_403_FORBIDDEN)
        
        # Get the image
        image = PropertyImage.objects.get(id=image_id, property=property_obj)
        
        # Set all other images of this property as non-primary
        PropertyImage.objects.filter(property=property_obj).exclude(id=image_id).update(is_primary=False)
        
        # Set this image as primary
        image.is_primary = True
        image.save()
        
        return Response({
            'message': 'Image set as primary successfully',
            'image_id': image_id,
            'property_id': property_id
        })
        
    except Property.DoesNotExist:
        return Response({'error': 'Property not found'}, status=404)
    except PropertyImage.DoesNotExist:
        return Response({'error': 'Image not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
# properties/views.py
class PropertyImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PropertyImageSerializer
    permission_classes = [permissions.IsAuthenticated, IsPropertyOwnerOrReadOnly]
    
    def get_queryset(self):
        return PropertyImage.objects.filter(property__seller=self.request.user)

    def get_object(self):
        queryset = self.get_queryset()
        obj = generics.get_object_or_404(queryset, pk=self.kwargs['pk'])
        return obj

    def perform_update(self, serializer):
        # If setting as primary, remove primary status from other images
        if serializer.validated_data.get('is_primary', False):
            PropertyImage.objects.filter(property=self.get_object().property).exclude(id=self.get_object().id).update(is_primary=False)
        serializer.save()

    def perform_destroy(self, instance):
        # If deleting primary image, set another image as primary if available
        was_primary = instance.is_primary
        property_obj = instance.property
        
        # Delete the actual file from storage
        if instance.image:
            instance.image.delete()
        instance.delete()
        
        # If we deleted the primary image, set the first remaining image as primary
        if was_primary:
            remaining_images = PropertyImage.objects.filter(property=property_obj)
            if remaining_images.exists():
                new_primary = remaining_images.first()
                new_primary.is_primary = True
                new_primary.save()
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

###WISHLIST MODEL
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_wishlist_stats(request):
    """Get wishlist statistics for admin"""
    try:
        total_wishlist_items = Wishlist.objects.count()
        total_users_with_wishlists = Wishlist.objects.values('user').distinct().count()
        
        # Get most popular properties
        popular_properties = Wishlist.objects.values(
            'property__id', 
            'property__name'
        ).annotate(
            wishlist_count=Count('id')
        ).order_by('-wishlist_count')[:5]
        
        most_popular = [
            {
                'property_id': item['property__id'],
                'property_name': item['property__name'] or 'Unnamed Property',
                'wishlist_count': item['wishlist_count']
            }
            for item in popular_properties
        ]
        
        # Use the old field names that your frontend expects
        stats = {
            'total_wishlists': total_wishlist_items,  # Map to old field name
            'total_users_with_wishlists': total_users_with_wishlists,
            'total_wishlist_items': total_wishlist_items,  # Keep for backward compatibility
            'most_popular_properties': most_popular,
        }
        
        return Response(stats)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_all_wishlists(request):
    """Get all wishlists with user and property details"""
    wishlists = Wishlist.objects.select_related('user', 'property').prefetch_related('property__images').all()
    
    # Group by user
    user_wishlists = {}
    for wishlist in wishlists:
        user_id = wishlist.user.id
        if user_id not in user_wishlists:
            # FIX: Use absolute URL for profile picture
            profile_picture_url = None
            if wishlist.user.profile_picture:
                try:
                    profile_picture_url = request.build_absolute_uri(wishlist.user.profile_picture.url)
                except Exception as e:
                    print(f"Error building profile picture URL: {e}")
                    profile_picture_url = None
            
            user_wishlists[user_id] = {
                'user': {
                    'id': wishlist.user.id,
                    'username': wishlist.user.username,
                    'email': wishlist.user.email,
                    'profile_picture_url': profile_picture_url,
                },
                'wishlist_items': [],
                'total_items': 0
            }
        
        # FIX: Use absolute URLs for property images
        property_images = []
        for image in wishlist.property.images.all():
            try:
                image_url = request.build_absolute_uri(image.image.url)
                property_images.append({
                    'id': image.id,
                    'image': image_url,  # This is now an absolute URL
                    'is_primary': image.is_primary
                })
            except Exception as e:
                print(f"Error building property image URL: {e}")
                continue
        
        user_wishlists[user_id]['wishlist_items'].append({
            'id': wishlist.id,
            'property': {
                'id': wishlist.property.id,
                'name': wishlist.property.name,
                'price': str(wishlist.property.price),
                'city': wishlist.property.city,
                'property_type': wishlist.property.property_type,
                'images': property_images  # Now contains absolute URLs
            },
            'added_at': wishlist.created_at.isoformat()
        })
        user_wishlists[user_id]['total_items'] += 1
    
    # Sort wishlist items by created_at (newest first) for each user
    for user_data in user_wishlists.values():
        user_data['wishlist_items'].sort(key=lambda x: x['added_at'], reverse=True)
    
    return Response(list(user_wishlists.values()))

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_wishlist(request, user_id):
    """Get specific user's wishlist"""
    wishlists = Wishlist.objects.filter(user_id=user_id).select_related('user', 'property').prefetch_related('property__images')
    
    if not wishlists.exists():
        return Response({'error': 'User has no wishlist items'}, status=404)
    
    # FIX: Use absolute URL for profile picture
    profile_picture_url = None
    if wishlists[0].user.profile_picture:
        try:
            profile_picture_url = request.build_absolute_uri(wishlists[0].user.profile_picture.url)
        except Exception as e:
            print(f"Error building profile picture URL: {e}")
            profile_picture_url = None
    
    user_data = {
        'user': {
            'id': wishlists[0].user.id,
            'username': wishlists[0].user.username,
            'email': wishlists[0].user.email,
            'profile_picture_url': profile_picture_url,
        },
        'wishlist_items': [],
        'total_items': wishlists.count()
    }
    
    for wishlist in wishlists:
        # FIX: Use absolute URLs for property images
        property_images = []
        for image in wishlist.property.images.all():
            try:
                image_url = request.build_absolute_uri(image.image.url)
                property_images.append({
                    'id': image.id,
                    'image': image_url,  # This is now an absolute URL
                    'is_primary': image.is_primary
                })
            except Exception as e:
                print(f"Error building property image URL: {e}")
                continue
        
        user_data['wishlist_items'].append({
            'id': wishlist.id,
            'property': {
                'id': wishlist.property.id,
                'name': wishlist.property.name,
                'price': str(wishlist.property.price),
                'city': wishlist.property.city,
                'property_type': wishlist.property.property_type,
                'images': property_images  # Now contains absolute URLs
            },
            'added_at': wishlist.created_at.isoformat()
        })
    
    # Sort by newest first
    user_data['wishlist_items'].sort(key=lambda x: x['added_at'], reverse=True)
    
    return Response(user_data)


  

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_remove_wishlist_item(request, user_id, wishlist_item_id):
    """Remove item from user's wishlist"""
    try:
        wishlist_item = Wishlist.objects.get(id=wishlist_item_id, user_id=user_id)
        wishlist_item.delete()
        return Response({'message': 'Item removed from wishlist'})
    except Wishlist.DoesNotExist:
        return Response({'error': 'Wishlist item not found'}, status=404)
    


#admin for properties images 


# Add these admin property images views after your existing admin views

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_property_images_stats(request):
    """
    Get statistics for property images
    """
    try:
        total_images = PropertyImage.objects.count()
        properties_with_images = Property.objects.filter(images__isnull=False).distinct().count()
        properties_without_images = Property.objects.filter(images__isnull=True).count()
        
        # Images uploaded in last 7 days
        week_ago = timezone.now() - timedelta(days=7)
        recent_images = PropertyImage.objects.filter(uploaded_at__gte=week_ago).count()
        
        # Properties with most images
        properties_most_images = Property.objects.annotate(
            image_count=Count('images')
        ).filter(image_count__gt=0).order_by('-image_count')[:5]
        
        properties_most_images_data = [
            {
                'property_id': prop.id,
                'property_name': prop.name,
                'image_count': prop.image_count,
                'city': prop.city
            }
            for prop in properties_most_images
        ]
        
        return Response({
            'total_images': total_images,
            'properties_with_images': properties_with_images,
            'properties_without_images': properties_without_images,
            'recent_images': recent_images,
            'properties_most_images': properties_most_images_data
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_all_property_images(request):
    """
    Get all property images with filtering and pagination
    """
    try:
        # Query parameters
        property_id = request.GET.get('property_id')
        seller_id = request.GET.get('seller_id')
        has_primary = request.GET.get('has_primary')
        search = request.GET.get('search', '')
        
        # Start with all images
        images = PropertyImage.objects.select_related(
            'property', 
            'property__seller'
        ).all()
        
        # Apply filters
        if property_id:
            images = images.filter(property_id=property_id)
            
        if seller_id:
            images = images.filter(property__seller_id=seller_id)
            
        if has_primary is not None:
            if has_primary.lower() == 'true':
                images = images.filter(is_primary=True)
            elif has_primary.lower() == 'false':
                images = images.filter(is_primary=False)
        
        if search:
            images = images.filter(
                Q(property__name__icontains=search) |
                Q(property__city__icontains=search) |
                Q(property__seller__username__icontains=search)
            )
        
        # Order by property and primary status
        images = images.order_by('property__name', '-is_primary', 'uploaded_at')
        
        # Pagination
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        
        total_count = images.count()
        paginated_images = images[start_index:end_index]
        
        # Serialize data
        images_data = []
        for image in paginated_images:
            try:
                image_url = request.build_absolute_uri(image.image.url)
            except:
                image_url = None
                
            images_data.append({
                'id': image.id,
                'image_url': image_url,
                'is_primary': image.is_primary,
                'uploaded_at': image.uploaded_at,
                'property': {
                    'id': image.property.id,
                    'name': image.property.name,
                    'city': image.property.city,
                    'price': str(image.property.price),
                    'property_type': image.property.property_type,
                    'is_available': image.property.is_available
                },
                'seller': {
                    'id': image.property.seller.id,
                    'username': image.property.seller.username,
                    'email': image.property.seller.email
                }
            })
        
        return Response({
            'images': images_data,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_set_primary_image(request, image_id):
    """
    Set an image as primary for a property
    """
    try:
        image = PropertyImage.objects.get(id=image_id)
        
        # Set all other images of this property as non-primary
        PropertyImage.objects.filter(property=image.property).update(is_primary=False)
        
        # Set this image as primary
        image.is_primary = True
        image.save()
        
        return Response({
            'message': 'Image set as primary successfully',
            'image_id': image_id,
            'property_id': image.property.id
        })
        
    except PropertyImage.DoesNotExist:
        return Response({'error': 'Image not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_property_image(request, image_id):
    """
    Delete a property image
    """
    try:
        image = PropertyImage.objects.get(id=image_id)
        property_id = image.property.id
        property_name = image.property.name
        
        # Delete the actual file from storage
        if image.image:
            image.image.delete()
        
        image.delete()
        
        return Response({
            'message': 'Image deleted successfully',
            'deleted_image_id': image_id,
            'property_id': property_id,
            'property_name': property_name
        })
        
    except PropertyImage.DoesNotExist:
        return Response({'error': 'Image not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_properties_without_images(request):
    """
    Get properties that have no images
    """
    try:
        properties = Property.objects.filter(images__isnull=True)
        
        # Apply search filter
        search = request.GET.get('search', '')
        if search:
            properties = properties.filter(
                Q(name__icontains=search) |
                Q(city__icontains=search) |
                Q(seller__username__icontains=search)
            )
        
        properties_data = []
        for prop in properties:
            properties_data.append({
                'id': prop.id,
                'name': prop.name,
                'city': prop.city,
                'price': str(prop.price),
                'property_type': prop.property_type,
                'is_available': prop.is_available,
                'created_at': prop.created_at,
                'seller': {
                    'id': prop.seller.id,
                    'username': prop.seller.username,
                    'email': prop.seller.email
                }
            })
        
        return Response({
            'properties': properties_data,
            'total_count': properties.count()
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_bulk_image_actions(request):
    """
    Bulk actions for property images (delete, set primary)
    """
    try:
        image_ids = request.data.get('image_ids', [])
        action = request.data.get('action')  # 'delete', 'set_primary'
        
        if not image_ids:
            return Response({"error": "No image IDs provided"}, status=400)
        
        if action not in ['delete', 'set_primary']:
            return Response({"error": "Invalid action"}, status=400)
        
        images = PropertyImage.objects.filter(id__in=image_ids)
        
        if action == 'delete':
            # Delete files from storage
            for image in images:
                if image.image:
                    image.image.delete()
            
            count = images.count()
            images.delete()
            message = f"Deleted {count} images"
            
        elif action == 'set_primary':
            # Group by property and set primary
            properties_updated = set()
            for image in images:
                # Set all images of this property as non-primary first
                PropertyImage.objects.filter(property=image.property).update(is_primary=False)
                # Set this image as primary
                image.is_primary = True
                image.save()
                properties_updated.add(image.property.id)
            
            message = f"Set primary images for {len(properties_updated)} properties"
        
        return Response({"message": message})
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    


 # properties/views.py - Fix the admin_property_analytics function
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_property_analytics(request):
    """Comprehensive property analytics for admin dashboard"""
    try:
        # Get time range from query params
        time_range = request.GET.get('period', '30d')
        
        # Calculate date range
        end_date = timezone.now()
        if time_range == '7d':
            start_date = end_date - timedelta(days=7)
        elif time_range == '90d':
            start_date = end_date - timedelta(days=90)
        elif time_range == '1y':
            start_date = end_date - timedelta(days=365)
        else:  # 30d default
            start_date = end_date - timedelta(days=30)

        # Basic property stats
        total_properties = Property.objects.count()
        active_properties = Property.objects.filter(is_available=True).count()
        new_properties = Property.objects.filter(created_at__gte=start_date).count()
        
        # Property type distribution
        properties_by_type = Property.objects.values('property_type').annotate(
            count=Count('id'),
            avg_price=Avg('price'),
            avg_size=Avg('size')
        )
        
        # City distribution
        properties_by_city = Property.objects.values('city').annotate(
            count=Count('id'),
            avg_price=Avg('price')
        ).order_by('-count')[:10]
        
        # Price statistics - handle None values
        price_aggregation = Property.objects.aggregate(
            min_price=Avg('price'),
            max_price=Avg('price'),
            avg_price=Avg('price'),
            total_value=Sum('price')
        )
        
        price_stats = {
            'min_price': float(price_aggregation['min_price']) if price_aggregation['min_price'] else 0,
            'max_price': float(price_aggregation['max_price']) if price_aggregation['max_price'] else 0,
            'avg_price': float(price_aggregation['avg_price']) if price_aggregation['avg_price'] else 0,
            'total_value': float(price_aggregation['total_value']) if price_aggregation['total_value'] else 0
        }
        
        # Room statistics
        room_aggregation = Property.objects.aggregate(
            avg_rooms=Avg('number_of_rooms'),
            max_rooms=Avg('number_of_rooms'),
            min_rooms=Avg('number_of_rooms')
        )
        
        room_stats = {
            'avg_rooms': float(room_aggregation['avg_rooms']) if room_aggregation['avg_rooms'] else 0,
            'max_rooms': float(room_aggregation['max_rooms']) if room_aggregation['max_rooms'] else 0,
            'min_rooms': float(room_aggregation['min_rooms']) if room_aggregation['min_rooms'] else 0
        }
        
        # Size statistics
        size_aggregation = Property.objects.aggregate(
            avg_size=Avg('size'),
            max_size=Avg('size'),
            min_size=Avg('size')
        )
        
        size_stats = {
            'avg_size': float(size_aggregation['avg_size']) if size_aggregation['avg_size'] else 0,
            'max_size': float(size_aggregation['max_size']) if size_aggregation['max_size'] else 0,
            'min_size': float(size_aggregation['min_size']) if size_aggregation['min_size'] else 0
        }
        
        # Wishlist engagement
        wishlist_aggregation = Property.objects.annotate(
            wishlist_count=Count('wishlisted_by')
        ).aggregate(
            total_wishlists=Sum('wishlist_count'),
            avg_wishlists_per_property=Avg('wishlist_count'),
            max_wishlists=Avg('wishlist_count')
        )
        
        wishlist_stats = {
            'total_wishlists': wishlist_aggregation['total_wishlists'] or 0,
            'avg_wishlists_per_property': float(wishlist_aggregation['avg_wishlists_per_property']) if wishlist_aggregation['avg_wishlists_per_property'] else 0,
            'max_wishlists': float(wishlist_aggregation['max_wishlists']) if wishlist_aggregation['max_wishlists'] else 0
        }
        
        # Top performing properties (by wishlist count)
        top_properties = Property.objects.annotate(
            wishlist_count=Count('wishlisted_by')
        ).order_by('-wishlist_count')[:10]
        
        # Seller performance
        top_sellers = User.objects.filter(
            role=User.Role.SELLER, 
            properties__isnull=False
        ).annotate(
            property_count=Count('properties'),
            total_value=Sum('properties__price'),
            avg_price=Avg('properties__price')
        ).order_by('-property_count')[:5]
        
        # Recent activity
        recent_activity = Property.objects.filter(
            created_at__gte=start_date
        ).values('created_at__date').annotate(
            count=Count('id')
        ).order_by('created_at__date')
        
        analytics_data = {
            'period': f"Last {time_range}",
            'overview': {
                'total': total_properties,
                'active': active_properties,
                'new': new_properties,
                'inactive': total_properties - active_properties
            },
            'typeDistribution': [
                {
                    'property_type': item['property_type'],
                    'count': item['count'],
                    'avg_price': float(item['avg_price']) if item['avg_price'] else 0,
                    'avg_size': float(item['avg_size']) if item['avg_size'] else 0
                }
                for item in properties_by_type
            ],
            'cityDistribution': [
                {
                    'city': item['city'],
                    'count': item['count'],
                    'avg_price': float(item['avg_price']) if item['avg_price'] else 0
                }
                for item in properties_by_city
            ],
            'priceStats': price_stats,
            'roomStats': room_stats,
            'sizeStats': size_stats,
            'engagement': wishlist_stats,
            'topProperties': [
                {
                    'id': prop.id,
                    'name': prop.name,
                    'city': prop.city,
                    'price': float(prop.price) if prop.price else 0,
                    'type': prop.property_type,
                    'wishlists': prop.wishlist_count,
                    'seller': prop.seller.username if prop.seller else 'Unknown',
                    'created_at': prop.created_at.isoformat() if prop.created_at else None
                }
                for prop in top_properties
            ],
            'topSellers': [
                {
                    'id': seller.id,
                    'username': seller.username,
                    'email': seller.email,
                    'property_count': seller.property_count,
                    'total_value': float(seller.total_value) if seller.total_value else 0,
                    'avg_price': float(seller.avg_price) if seller.avg_price else 0
                }
                for seller in top_sellers
            ],
            'recentActivity': list(recent_activity)
        }
        
        return Response(analytics_data)
        
    except Exception as e:
        print(f"Property analytics error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        
        return Response(
            {'error': f'Failed to generate property analytics: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# properties/views.py - Add debug endpoint
@api_view(['GET'])
@permission_classes([IsAdminUser])
def debug_property_data(request):
    """Debug endpoint to check property data"""
    try:
        # Test basic counts
        total_properties = Property.objects.count()
        total_images = PropertyImage.objects.count()
        total_wishlists = Wishlist.objects.count()
        
        # Test property with images
        properties_with_images = Property.objects.filter(images__isnull=False).distinct().count()
        
        # Test wishlist aggregation
        wishlist_test = Property.objects.annotate(
            wishlist_count=Count('wishlisted_by')
        ).first()
        
        debug_data = {
            'total_properties': total_properties,
            'total_images': total_images,
            'total_wishlists': total_wishlists,
            'properties_with_images': properties_with_images,
            'sample_property_wishlists': wishlist_test.wishlist_count if wishlist_test else 0,
            'database_tables': ['Property', 'PropertyImage', 'Wishlist']
        }
        
        return Response(debug_data)
        
    except Exception as e:
        return Response({
            'error': str(e),
            'traceback': traceback.format_exc()
        }, status=500)

# properties/views.py - Fix the admin_property_performance function
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_property_performance(request):
    """Detailed property performance metrics"""
    try:
        # Get total properties count safely
        total_properties = Property.objects.count()
        
        # Properties with highest engagement (wishlists)
        high_engagement = Property.objects.annotate(
            wishlist_count=Count('wishlisted_by')
        ).filter(wishlist_count__gt=0).order_by('-wishlist_count')[:20]
        
        # Properties without images
        properties_without_images = Property.objects.filter(
            images__isnull=True
        ).count()
        
        # Properties with images (distinct count)
        properties_with_images = Property.objects.filter(
            images__isnull=False
        ).distinct().count()
        
        # Total property images count
        total_images = PropertyImage.objects.count()
        
        # Calculate average images per property safely
        avg_images_per_property = total_images / total_properties if total_properties > 0 else 0
        
        # Properties with primary image
        properties_with_primary_image = Property.objects.filter(
            images__is_primary=True
        ).distinct().count()
        
        # Properties by availability status
        availability_stats = Property.objects.values('is_available').annotate(
            count=Count('id')
        )
        
        # Property age analysis
        now = timezone.now()
        property_age_stats = {
            'less_than_week': Property.objects.filter(
                created_at__gte=now - timedelta(days=7)
            ).count(),
            'less_than_month': Property.objects.filter(
                created_at__gte=now - timedelta(days=30)
            ).count(),
            'less_than_3_months': Property.objects.filter(
                created_at__gte=now - timedelta(days=90)
            ).count(),
            'older_than_3_months': Property.objects.filter(
                created_at__lt=now - timedelta(days=90)
            ).count()
        }
        
        performance_data = {
            'highEngagementProperties': [
                {
                    'id': prop.id,
                    'name': prop.name,
                    'city': prop.city,
                    'price': float(prop.price) if prop.price else 0,
                    'wishlists': prop.wishlist_count,
                    'seller': prop.seller.username if prop.seller else 'Unknown',
                    'created_at': prop.created_at.isoformat() if prop.created_at else None,
                    'is_available': prop.is_available
                }
                for prop in high_engagement
            ],
            'qualityMetrics': {
                'properties_without_images': properties_without_images,
                'properties_with_images': properties_with_images,
                'avg_images_per_property': round(avg_images_per_property, 2),
                'properties_with_primary_image': properties_with_primary_image
            },
            'availabilityStats': list(availability_stats),
            'ageDistribution': property_age_stats
        }
        
        return Response(performance_data)
        
    except Exception as e:
        print(f"Property performance error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        
        return Response(
            {'error': f'Failed to fetch property performance data: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    


# users/views.py - Add this function
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_analytics(request):
    """Comprehensive analytics data for admin dashboard"""
    try:
        # Get time range from query params
        time_range = request.GET.get('period', '30d')
        
        # Calculate date range
        end_date = timezone.now()
        if time_range == '7d':
            start_date = end_date - timedelta(days=7)
        elif time_range == '90d':
            start_date = end_date - timedelta(days=90)
        elif time_range == '1y':
            start_date = end_date - timedelta(days=365)
        else:  # 30d default
            start_date = end_date - timedelta(days=30)

        # User analytics
        total_users = User.objects.count()
        total_buyers = User.objects.filter(role=User.Role.BUYER).count()
        total_sellers = User.objects.filter(role=User.Role.SELLER).count()
        new_users = User.objects.filter(date_joined__gte=start_date).count()
        
        # Calculate user growth rate
        previous_period_users = User.objects.filter(
            date_joined__lt=start_date
        ).count()
        user_growth_rate = ((total_users - previous_period_users) / previous_period_users * 100) if previous_period_users > 0 else 0

        # Property analytics - import Property model
        from properties.models import Property, Wishlist, PropertyImage
        
        total_properties = Property.objects.count()
        active_properties = Property.objects.filter(is_available=True).count()
        new_properties = Property.objects.filter(created_at__gte=start_date).count()
        
        # Property views (placeholder)
        total_property_views = 0
        
        # Calculate conversion rate (placeholder)
        conversion_rate = 0
        
        # Revenue analytics (placeholder)
        total_revenue = 0
        revenue_growth_rate = 0
        
        # Engagement analytics
        total_wishlist_items = Wishlist.objects.count()
        new_wishlist_items = Wishlist.objects.filter(created_at__gte=start_date).count()
        
        # User demographics
        top_locations = Property.objects.values('city').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        # Top performing properties
        top_properties = Property.objects.annotate(
            wishlist_count=Count('wishlisted_by')
        ).order_by('-wishlist_count')[:5]
        
        analytics_data = {
            'period': f"Last {time_range}",
            'userGrowth': {
                'total': total_users,
                'newUsers': new_users,
                'growthRate': round(user_growth_rate, 1),
                'trend': 'up' if user_growth_rate > 0 else 'down' if user_growth_rate < 0 else 'stable'
            },
            'propertyMetrics': {
                'total': total_properties,
                'active': active_properties,
                'views': total_property_views,
                'conversionRate': conversion_rate
            },
            'revenue': {
                'total': total_revenue,
                'projected': total_revenue * 1.1,
                'growthRate': revenue_growth_rate,
                'trend': 'up' if revenue_growth_rate > 0 else 'down' if revenue_growth_rate < 0 else 'stable'
            },
            'engagement': {
                'avgSessionDuration': 4.2,
                'bounceRate': 32.1,
                'wishlistAdds': total_wishlist_items,
                'pageViews': total_property_views
            },
            'topProperties': [
                {
                    'id': str(prop.id),
                    'name': prop.name,
                    'views': prop.wishlist_count * 10,
                    'wishlists': prop.wishlist_count,
                    'inquiries': prop.wishlist_count // 2,
                    'conversionRate': round((prop.wishlist_count // 2) / (prop.wishlist_count * 10) * 100, 1) if prop.wishlist_count > 0 else 0
                }
                for prop in top_properties
            ],
            'userDemographics': {
                'buyers': total_buyers,
                'sellers': total_sellers,
                'verifiedSellers': SellerVerification.objects.filter(status='approved').count(),
                'topLocations': [
                    {
                        'city': loc['city'],
                        'users': loc['count'],
                        'percentage': round((loc['count'] / total_properties) * 100, 1) if total_properties > 0 else 0
                    }
                    for loc in top_locations
                ]
            }
        }
        
        return Response(analytics_data)
        
    except Exception as e:
        print(f"Analytics error: {str(e)}")
        return Response(
            {'error': 'Failed to generate analytics data'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
