# users/services.py
from django.core.mail import send_mail
from django.conf import settings

def send_verification_email(verification, status):
    user = verification.user
    
    print(f"🚀 SENDING EMAIL: User: {user.email}, Status: {status}")
    
    if status == 'approved':
        subject = "Congratulations! You're Now a Verified Seller"
        message = f"""
        Hello {user.first_name or user.username},
        
        Great news! Your seller verification has been APPROVED! 🎉
        
        You are now a verified seller on RealEstate Pro. You can:
        - List properties for sale
        - Manage your property portfolio
        - Connect with potential buyers
        
        Log in to start listing your properties: http://localhost:3000
        
        Best regards,
        The RealEstate Pro Team
        """
    elif status == 'rejected':
        subject = "Update on Your Seller Verification Request"
        reason = verification.admin_notes or "Please contact support for more information."
        message = f"""
        Hello {user.first_name or user.username},
        
        Your seller verification request has been rejected.
        
        Reason: {reason}
        
        You can submit a new verification request with corrected documents.
        
        If you have questions, please contact our support team.
        
        Best regards,
        The RealEstate Pro Team
        """
    
    try:
        print(f"📧 Attempting to send email to: {user.email}")
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        print(f"✅ Email successfully sent to {user.email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {user.email}: {str(e)}")
        return False