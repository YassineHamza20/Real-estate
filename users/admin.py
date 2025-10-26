# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone
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
        for verification in queryset:
            verification.status = SellerVerification.VerificationStatus.APPROVED
            verification.reviewed_at = timezone.now()
            verification.save()
            
            # Change user role to seller when approved
            user = verification.user
            user.role = User.Role.SELLER
            user.save()
        
        self.message_user(request, f'{queryset.count()} verifications approved and users upgraded to sellers.')
    
    def reject_verifications(self, request, queryset):
        updated = queryset.update(status=SellerVerification.VerificationStatus.REJECTED, reviewed_at=timezone.now())
        self.message_user(request, f'{updated} verifications rejected.')
    
    # Also override the save_model to handle individual status changes
    def save_model(self, request, obj, form, change):
        if change and 'status' in form.changed_data:
            if obj.status == SellerVerification.VerificationStatus.APPROVED:
                # Change user role to seller when approved
                obj.reviewed_at = timezone.now()
                user = obj.user
                user.role = User.Role.SELLER
                user.save()
            elif obj.status == SellerVerification.VerificationStatus.REJECTED:
                obj.reviewed_at = timezone.now()
        
        super().save_model(request, obj, form, change)
    
    approve_verifications.short_description = "Approve selected verifications"
    reject_verifications.short_description = "Reject selected verifications"

admin.site.register(User, CustomUserAdmin)