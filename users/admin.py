from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SellerVerification

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'phone_number', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone_number', 'email_verified')}),
    )

@admin.register(SellerVerification)
class SellerVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'submitted_at', 'reviewed_at')
    list_filter = ('status',)
    list_editable = ('status',)
    readonly_fields = ('submitted_at',)
    actions = ['approve_verifications', 'reject_verifications']
    
    def approve_verifications(self, request, queryset):
        updated = queryset.update(status=SellerVerification.Status.APPROVED, reviewed_at=timezone.now())
        self.message_user(request, f'{updated} verifications approved.')
    
    def reject_verifications(self, request, queryset):
        updated = queryset.update(status=SellerVerification.Status.REJECTED, reviewed_at=timezone.now())
        self.message_user(request, f'{updated} verifications rejected.')
    
    approve_verifications.short_description = "Approve selected verifications"
    reject_verifications.short_description = "Reject selected verifications"

admin.site.register(User, CustomUserAdmin)