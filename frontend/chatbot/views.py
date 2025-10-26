# Add these imports at the top of the file
import logging
import time
from django.core.cache import cache
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
import uuid
from django.conf import settings

from .models import ChatSession, ChatMessage
from .serializers import ChatRequestSerializer, ChatSessionSerializer, ChatMessageSerializer
from .services.gemini_service import GeminiChatService

# Add logger
logger = logging.getLogger(__name__)

# Rate limiting configuration
RATE_LIMIT_REQUESTS = 30  # Max requests per window
RATE_LIMIT_WINDOW = 60    # Time window in seconds

def check_rate_limit(user_id):
    """Check if user has exceeded rate limit"""
    cache_key = f"chat_rate_limit_{user_id}"
    request_count = cache.get(cache_key, 0)
    
    if request_count >= RATE_LIMIT_REQUESTS:
        return False, "Rate limit exceeded. Please wait 1 minute before sending more messages."
    
    cache.set(cache_key, request_count + 1, RATE_LIMIT_WINDOW)
    return True, None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """
    Send a message to the chatbot and get AI response
    """
    # Rate limiting check
    rate_ok, rate_error = check_rate_limit(request.user.id)
    if not rate_ok:
        return Response({
            'success': False,
            'error': rate_error,
            'rate_limited': True
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    serializer = ChatRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    message = serializer.validated_data['message']
    session_id = serializer.validated_data.get('session_id')
    
    try:
        # Get or create chat session
        if session_id:
            chat_session, created = ChatSession.objects.get_or_create(
                session_id=session_id,
                user=request.user
            )
        else:
            session_id = str(uuid.uuid4())
            chat_session = ChatSession.objects.create(
                session_id=session_id,
                user=request.user
            )
        
        # Save user message
        user_message = ChatMessage.objects.create(
            session=chat_session,
            role='user',
            content=message
        )
        
        # Get conversation history for context
        recent_messages = ChatMessage.objects.filter(
            session=chat_session
        ).order_by('-timestamp')[:10]
        
        conversation_history = [
            {'role': msg.role, 'content': msg.content}
            for msg in recent_messages
        ]
        
        # Get AI response with timing
        start_time = time.time()
        try:
            gemini_service = GeminiChatService()
            ai_response = gemini_service.generate_response(message, conversation_history)
        except Exception as e:
            logger.error(f"AI service error: {str(e)}")
            return Response({
                'success': False,
                'error': f'AI service error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        response_time = time.time() - start_time
        
        if ai_response['success']:
            # Save AI response WITHOUT response_time for now
            assistant_message = ChatMessage.objects.create(
                session=chat_session,
                role='assistant',
                content=ai_response['response']
                # Remove response_time until migration is done
            )
            
            # Update session
            chat_session.save()
            
            # Get updated session data
            session_serializer = ChatSessionSerializer(chat_session)
            
            return Response({
                'success': True,
                'session_id': session_id,
                'response': ai_response['response'],
                'conversation': session_serializer.data,
                'performance': {
                    'response_time': round(response_time, 2),
                    'message_count': chat_session.messages.count()
                }
            })
        else:
            logger.error(f"Gemini AI response error: {ai_response.get('error')}")
            return Response({
                'success': False,
                'error': ai_response.get('error', 'AI service error')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Unexpected error in send_message: {str(e)}")
        return Response({
            'success': False,
            'error': f'An unexpected error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_rate_limit_status(request):
    """Get current rate limit status for the user"""
    cache_key = f"chat_rate_limit_{request.user.id}"
    request_count = cache.get(cache_key, 0)
    remaining = max(0, RATE_LIMIT_REQUESTS - request_count)
    
    return Response({
        'rate_limits': {
            'max_requests': RATE_LIMIT_REQUESTS,
            'window_seconds': RATE_LIMIT_WINDOW,
            'current_requests': request_count,
            'remaining_requests': remaining,
            'reset_in': cache.ttl(cache_key) if request_count > 0 else 0
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def test_gemini(request):
    """Test endpoint to check Gemini AI"""
    try:
        gemini_service = GeminiChatService()
        test_response = gemini_service.generate_response("Hello, are you working?")
        
        return Response({
            'success': test_response['success'],
            'response': test_response.get('response'),
            'error': test_response.get('error'),
            'message': 'Gemini test completed'
        })
    except Exception as e:
        logger.error(f"Test endpoint error: {str(e)}")
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Check your Gemini API key and configuration'
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_history(request, session_id):
    """
    Get chat history for a specific session
    """
    try:
        chat_session = ChatSession.objects.get(
            session_id=session_id,
            user=request.user
        )
        serializer = ChatSessionSerializer(chat_session)
        return Response(serializer.data)
    except ChatSession.DoesNotExist:
        return Response({
            'error': 'Chat session not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_chat_sessions(request):
    """
    List all chat sessions for the current user
    """
    chat_sessions = ChatSession.objects.filter(user=request.user).order_by('-updated_at')
    
    # Add message counts to each session
    sessions_data = []
    for session in chat_sessions:
        session_data = ChatSessionSerializer(session).data
        session_data['message_count'] = session.messages.count()
        sessions_data.append(session_data)
    
    return Response({
        'sessions': sessions_data,
        'total_sessions': len(sessions_data)
    })

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_chat_session(request, session_id):
    """
    Delete a specific chat session
    """
    try:
        chat_session = ChatSession.objects.get(
            session_id=session_id,
            user=request.user
        )
        chat_session.delete()
        return Response({
            'success': True,
            'message': 'Chat session deleted successfully'
        })
    except ChatSession.DoesNotExist:
        return Response({
            'error': 'Chat session not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([AllowAny])
def list_models(request):
    """List all available Gemini models"""
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        models = genai.list_models()
        model_info = []
        
        for model in models:
            model_info.append({
                'name': model.name,
                'display_name': model.display_name,
                'description': model.description,
                'supported_methods': model.supported_generation_methods,
            })
        
        return Response({
            'available_models': model_info,
            'total_models': len(model_info)
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_conversation(request, session_id):
    """Export conversation as JSON"""
    try:
        chat_session = ChatSession.objects.get(
            session_id=session_id,
            user=request.user
        )
        messages = chat_session.messages.all().order_by('timestamp')
        
        export_data = {
            'export_info': {
                'session_id': session_id,
                'user': request.user.username,
                'exported_at': time.time(),
                'total_messages': messages.count()
            },
            'conversation': [
                {
                    'role': msg.role,
                    'content': msg.content,
                    'timestamp': msg.timestamp.isoformat(),
                    'response_time': getattr(msg, 'response_time', None)
                }
                for msg in messages
            ]
        }
        
        return Response(export_data)
        
    except ChatSession.DoesNotExist:
        return Response({
            'error': 'Chat session not found'
        }, status=status.HTTP_404_NOT_FOUND)