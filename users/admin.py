# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone
from .models import User, SellerVerification
from .services import send_verification_email

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'phone_number', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone_number', 'email_verified')}),
    )

class SellerVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'submitted_at', 'reviewed_at')
    list_filter = ('status',)
    list_editable = ('status',)
    readonly_fields = ('submitted_at',)
    actions = ['approve_verifications', 'reject_verifications']
    
    def approve_verifications(self, request, queryset):
        print("🟢 APPROVE ACTION TRIGGERED")
        for verification in queryset:
            print(f"Processing verification: {verification.user.username}")
            if verification.status != SellerVerification.VerificationStatus.APPROVED:
                verification.status = SellerVerification.VerificationStatus.APPROVED
                verification.reviewed_at = timezone.now()
                verification.save()
                
                # Change user role to seller
                user = verification.user
                user.role = User.Role.SELLER
                user.save()
                print(f"✅ User {user.username} role changed to: {user.role}")
                
                # Send approval email
                print(f"📧 Calling send_verification_email for {user.email}")
                send_verification_email(verification, 'approved')
            else:
                print(f"⚠️ Verification already approved for {verification.user.username}")
        
        self.message_user(request, f'{queryset.count()} verifications approved and emails sent.')
    
    def reject_verifications(self, request, queryset):
        print("🔴 REJECT ACTION TRIGGERED")
        for verification in queryset:
            print(f"Processing verification: {verification.user.username}")
            if verification.status != SellerVerification.VerificationStatus.REJECTED:
                verification.status = SellerVerification.VerificationStatus.REJECTED
                verification.reviewed_at = timezone.now()
                verification.save()
                
                # Send rejection email
                print(f"📧 Calling send_verification_email for {verification.user.email}")
                send_verification_email(verification, 'rejected')
            else:
                print(f"⚠️ Verification already rejected for {verification.user.username}")
        
        self.message_user(request, f'{queryset.count()} verifications rejected and emails sent.')
    
    def save_model(self, request, obj, form, change):
        print("💾 SAVE_MODEL CALLED")
        print(f"Change: {change}, Changed fields: {form.changed_data}")
        
        # Store old status to check if it changed
        old_status = None
        if change and obj.pk:
            try:
                old_obj = SellerVerification.objects.get(pk=obj.pk)
                old_status = old_obj.status
                print(f"Old status: {old_status}, New status: {obj.status}")
            except SellerVerification.DoesNotExist:
                print("❌ Could not find old verification object")
                pass
        
        # Save the model first
        super().save_model(request, obj, form, change)
        print("✅ Model saved")
        
        # Send email only if status changed
        if change and 'status' in form.changed_data:
            print("🔄 Status changed detected!")
            if obj.status == SellerVerification.VerificationStatus.APPROVED:
                print("🟢 Status changed to APPROVED")
                # Change user role to seller
                user = obj.user
                user.role = User.Role.SELLER
                user.save()
                print(f"✅ User {user.username} role changed to: {user.role}")
                
                # Send email if status changed to approved
                if old_status != SellerVerification.VerificationStatus.APPROVED:
                    print(f"📧 Calling send_verification_email for {user.email}")
                    send_verification_email(obj, 'approved')
                else:
                    print("⚠️ Status didn't change (already approved)")
                    
            elif obj.status == SellerVerification.VerificationStatus.REJECTED:
                print("🔴 Status changed to REJECTED")
                # Send email if status changed to rejected
                if old_status != SellerVerification.VerificationStatus.REJECTED:
                    print(f"📧 Calling send_verification_email for {obj.user.email}")
                    send_verification_email(obj, 'rejected')
                else:
                    print("⚠️ Status didn't change (already rejected)")
        else:
            print("ℹ️ No status change detected")
    
    approve_verifications.short_description = "Approve selected verifications"
    reject_verifications.short_description = "Reject selected verifications"

admin.site.register(User, CustomUserAdmin)
admin.site.register(SellerVerification, SellerVerificationAdmin)