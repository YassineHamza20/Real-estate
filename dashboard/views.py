# dashboard/views.py
from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from users.models import User, SellerVerification
from properties.models import Property, Wishlist

def is_admin(user):
    return user.is_staff or user.is_superuser

@login_required
@user_passes_test(is_admin)
def admin_dashboard(request):
    """Main admin dashboard with real statistics"""
    
    # Basic statistics from your actual data
    total_users = User.objects.count()
    total_properties = Property.objects.count()
    total_sellers = User.objects.filter(role='seller').count()
    total_buyers = User.objects.filter(role='buyer').count()
    verified_sellers = SellerVerification.objects.filter(status='approved').count()
    pending_verifications = SellerVerification.objects.filter(status='pending').count()
    
    # Property type statistics
    property_types = Property.objects.values('property_type').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Recent activity (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_properties = Property.objects.filter(created_at__gte=thirty_days_ago).count()
    recent_users = User.objects.filter(date_joined__gte=thirty_days_ago).count()
    
    # Popular cities (from your actual properties)
    popular_cities = Property.objects.values('city').annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    # Recent properties list
    recent_properties_list = Property.objects.select_related('seller').order_by('-created_at')[:5]
    
    # Wishlist statistics
    total_wishlists = Wishlist.objects.count()
    most_wishlisted = Property.objects.annotate(
        wishlist_count=Count('wishlisted_by')
    ).order_by('-wishlist_count')[:3]
    
    context = {
        'title': 'Real Estate Dashboard',
        
        # Core statistics
        'total_users': total_users,
        'total_properties': total_properties,
        'total_sellers': total_sellers,
        'total_buyers': total_buyers,
        'verified_sellers': verified_sellers,
        'pending_verifications': pending_verifications,
        
        # Property types for charts
        'property_types': list(property_types),
        
        # Recent activity
        'recent_properties': recent_properties,
        'recent_users': recent_users,
        
        # Popular data
        'popular_cities': popular_cities,
        'recent_properties_list': recent_properties_list,
        'most_wishlisted': most_wishlisted,
        'total_wishlists': total_wishlists,
    }
    
    return render(request, 'dashboard/admin_dashboard.html', context)