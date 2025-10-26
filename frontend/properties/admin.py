# properties/admin.py
from django.contrib import admin
from .models import Property, PropertyImage
from .models import Wishlist
class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('name', 'seller', 'price', 'city', 'property_type', 'is_available', 'created_at')
    list_filter = ('property_type', 'is_available', 'city', 'created_at')
    search_fields = ('name', 'description', 'address', 'city')
    inlines = [PropertyImageInline]

@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ('property', 'image', 'is_primary', 'uploaded_at')
    list_filter = ('is_primary', 'uploaded_at')


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'property', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'property__name')
    readonly_fields = ('created_at',)