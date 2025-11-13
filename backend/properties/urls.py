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
]
