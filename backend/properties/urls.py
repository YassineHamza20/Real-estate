# properties/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.PropertyListCreateView.as_view(), name='property-list-create'),
    path('<int:pk>/', views.PropertyDetailView.as_view(), name='property-detail'),
    path('my-properties/', views.UserPropertiesView.as_view(), name='user-properties'),
    path('<int:property_id>/images/', views.PropertyImageView.as_view(), name='property-images'),
    path('filters/options/', views.property_filters, name='property-filters'),

    path('<int:property_id>/images/', views.PropertyImageListView.as_view(), name='property-images-list'),
    path('images/<int:pk>/', views.PropertyImageDetailView.as_view(), name='property-image-detail'),
    path('<int:property_id>/images/<int:image_id>/set_primary/', views.set_primary_image, name='set-primary-image'),
    # Wishlist URLs
    path('wishlist/', views.WishlistListView.as_view(), name='wishlist-list'),
    path('wishlist/<int:pk>/', views.WishlistDetailView.as_view(), name='wishlist-detail'),
    path('wishlist/toggle/<int:property_id>/', views.toggle_wishlist, name='toggle-wishlist'),
    path('wishlist/check/<int:property_id>/', views.check_wishlist_status, name='check-wishlist'),

    path('admin/properties/', views.AdminPropertyListView.as_view(), name='admin-property-list'),
    path('admin/properties/<int:pk>/', views.AdminPropertyDetailView.as_view(), name='admin-property-detail'),
    path('admin/properties/stats/', views.admin_property_stats, name='admin-property-stats'),
    path('admin/properties/bulk-action/', views.admin_bulk_property_action, name='admin-bulk-property-action'),
    path('admin/properties/filters/', views.admin_property_filters, name='admin-property-filters'),



    path('admin/wishlists/stats/', views.admin_wishlist_stats, name='admin-wishlist-stats'),
    path('admin/wishlists/', views.admin_all_wishlists, name='admin-all-wishlists'),
    path('admin/users/<int:user_id>/wishlist/', views.admin_user_wishlist, name='admin-user-wishlist'),
    path('admin/users/<int:user_id>/wishlist/<int:wishlist_item_id>/', views.admin_remove_wishlist_item, name='admin-remove-wishlist-item'),



 # Admin Property Images URLs
       path('admin/images/stats/', views.admin_property_images_stats, name='admin-images-stats'),
    path('admin/images/', views.admin_all_property_images, name='admin-all-images'),
    path('admin/images/<int:image_id>/primary/', views.admin_set_primary_image, name='admin-set-primary-image'),
    path('admin/images/<int:image_id>/', views.admin_delete_property_image, name='admin-delete-image'),
    path('admin/properties/no-images/', views.admin_properties_without_images, name='admin-properties-no-images'),
    path('admin/images/bulk-actions/', views.admin_bulk_image_actions, name='admin-bulk-image-actions'),
   
    # properties/urls.py - Add these URLs
path('admin/analytics/', views.admin_property_analytics, name='admin-property-analytics'),
path('admin/analytics/performance/', views.admin_property_performance, name='admin-property-performance'),
path('admin/debug/', views.debug_property_data, name='debug-property-data'),
# users/urls.py - Add this URL
path('admin/analytics/', views.admin_analytics, name='admin-analytics'),
]
