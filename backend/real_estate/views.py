# real_estate/views.py
import json
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.middleware.csrf import get_token
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, get_user_model
from django.utils import timezone
from django.conf import settings

@csrf_exempt
def get_csrf_token(request):
    """Get CSRF token for frontend"""
    return JsonResponse({'csrfToken': get_token(request)})

@csrf_exempt
def debug_test(request):
    """Simple debug endpoint"""
    return JsonResponse({
        'success': True,
        'message': 'Debug endpoint is working!',
        'method': request.method,
        'timestamp': timezone.now().isoformat()
    })

@csrf_exempt
def test_google_auth(request):
    """Test endpoint to verify backend is working"""
    try:
        if request.method == 'POST':
            try:
                data = json.loads(request.body)
                test_data = data.get('test_data')
                
                return JsonResponse({
                    'success': True,
                    'message': 'Backend POST is working!',
                    'received_data': test_data,
                    'timestamp': timezone.now().isoformat()
                })
            except json.JSONDecodeError as e:
                return JsonResponse({
                    'success': False,
                    'error': f'JSON decode error: {str(e)}'
                }, status=400)
        
        # GET request
        return JsonResponse({
            'success': True,
            'message': 'GET request successful - Backend is running',
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Server error: {str(e)}'
        }, status=500)
 




@csrf_exempt
def google_auth(request):
    """
    Handle Google authentication from frontend
    """
    if request.method == 'POST':
        try:
            print("=== GOOGLE AUTH ENDPOINT HIT ===")
            
            # Parse the request data
            try:
                data = json.loads(request.body.decode('utf-8'))
                print(f"Received data keys: {list(data.keys())}")
            except Exception as e:
                print(f"Error parsing JSON: {e}")
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid JSON data'
                }, status=400)
            
            # Check for tokens
            access_token = data.get('access_token')
            print(f"Access token received: {access_token}")
            
            if not access_token:
                return JsonResponse({
                    'success': False,
                    'error': 'No access token provided'
                }, status=400)
            
            # DEBUG: Print token details
            print(f"Token length: {len(access_token) if access_token else 0}")
            print(f"Token starts with: {access_token[:20] if access_token else 'None'}")
            
            # Try to verify the token
            user_info = verify_google_token(access_token)
            
            if not user_info:
                print("❌ Token verification failed")
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid Google token or token verification failed'
                }, status=400)
            
            print(f"✅ Token verified for: {user_info.get('email')}")
            
            # Extract user information
            email = user_info.get('email')
            if not email:
                return JsonResponse({
                    'success': False,
                    'error': 'No email found in Google token'
                }, status=400)
            
            first_name = user_info.get('given_name', '')
            last_name = user_info.get('family_name', '')
            picture = user_info.get('picture', '')
            
            User = get_user_model()
            
            # Get or create user
            try:
                user = User.objects.get(email=email)
                created = False
                print(f"Existing user found: {email}")
                
                # Update email_verified to True for existing users logging in with Google
                if not user.email_verified:
                    user.email_verified = True
                    user.save()
                    print(f"✅ Updated email_verified to True for existing user: {email}")
                    
            except User.DoesNotExist:
                print(f"Creating new user: {email}")
                user = User.objects.create_user(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    username=email,
                    is_active=True,
                    email_verified=True  # Google verified users don't need email confirmation
                )
                user.set_unusable_password()
                user.save()
                created = True
                print(f"✅ Created new user with email_verified=True: {email}")
            
            # Log the user in
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            
            # Generate JWT tokens
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            response_data = {
                'success': True,
                'created': created,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'picture': picture,
                    'email_verified': user.email_verified,  # Include verification status
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
                'redirect_url': '/properties'
            }
            
            print(f"✅ Google authentication successful for: {user.email} (email_verified: {user.email_verified})")
            return JsonResponse(response_data)
            
        except Exception as e:
            print(f"❌ Error in google_auth: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return JsonResponse({
                'success': False,
                'error': f'Authentication failed: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'success': False,
        'error': 'Method not allowed'
    }, status=405)





def create_test_user(request, email, first_name, last_name):
    """Create a test user for development"""
    User = get_user_model()
    
    try:
        user = User.objects.get(email=email)
        created = False
    except User.DoesNotExist:
        user = User.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            username=email,
            is_active=True
        )
        user.set_unusable_password()
        user.save()
        created = True
    
    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
    
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    
    return JsonResponse({
        'success': True,
        'created': created,
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        },
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        },
        'redirect_url': '/properties',
        'debug': 'Development mode - Google token verification bypassed'
    })
def verify_google_token(token):
    """
    Verify Google token using UserInfo API (more reliable)
    """
    try:
        import requests
        
        print(f"🔐 Verifying token with UserInfo API...")
        
        # Call Google UserInfo API to verify the token
        response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {token}'},
            timeout=10
        )
        
        if response.status_code == 200:
            user_info = response.json()
            print(f"✅ UserInfo API success: {user_info.get('email')}")
            return user_info
        else:
            print(f"❌ UserInfo API failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ UserInfo API error: {e}")
        return None


@login_required
def auth_success(request):
    """Endpoint that frontend can check after successful authentication"""
    user = request.user
    
    return JsonResponse({
        'success': True,
        'message': 'Authentication successful',
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        },
        'timestamp': timezone.now().isoformat()
    })