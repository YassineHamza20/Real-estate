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
from properties.models import Property
from properties.serializers import PropertySerializer
from django.db.models import Q
import re

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
    Send a message to the chatbot and get AI response with property recommendations
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

        # SEARCH FOR RELEVANT PROPERTIES BASED ON USER QUERY
        properties = search_properties_by_query(message)
        property_serializer = PropertySerializer(
            properties, 
            many=True, 
            context={'request': request}
        )
        
        # Create property context for AI
        property_context = create_property_context(properties)
        
        # Enhance the message with property context for AI
        enhanced_message = f"User message: {message}\n\nAvailable properties in our database:\n{property_context}\n\nPlease provide helpful information about these properties and suggest relevant ones based on the user's query."
        
        # Get AI response with timing
        start_time = time.time()
        try:
            gemini_service = GeminiChatService()
            ai_response = gemini_service.generate_response(enhanced_message, conversation_history)
        except Exception as e:
            logger.error(f"AI service error: {str(e)}")
            return Response({
                'success': False,
                'error': f'AI service error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        response_time = time.time() - start_time
        
        if ai_response['success']:
            # Save AI response
            assistant_message = ChatMessage.objects.create(
                session=chat_session,
                role='assistant',
                content=ai_response['response']
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
                'properties': property_serializer.data,
                'properties_count': len(properties),
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







def search_properties_by_query(query):
    """
    Smart property search based on natural language queries
    FIXED: Now properly filters by city and other criteria
    """
    properties = Property.objects.filter(is_available=True)
    
    if not query or query.strip() == "":
        return properties.order_by('-created_at')[:6]
    
    query_lower = query.lower().strip()
    logger.info(f"Searching properties for query: '{query}'")
    
    # Track if any filters were applied
    filters_applied = False
    
    # FIXED: Extract location keywords - better matching
    locations = extract_locations(query_lower)
    if locations:
        logger.info(f"Found locations in query: {locations}")
        # Use Q objects to search in multiple cities
        location_query = Q()
        for location in locations:
            # Use case-insensitive contains for better matching
            location_query |= Q(city__icontains=location)
        properties = properties.filter(location_query)
        filters_applied = True
        logger.info(f"After location filter: {properties.count()} properties")
    
    # Extract property type
    property_type = extract_property_type(query_lower)
    if property_type:
        logger.info(f"Found property type: {property_type}")
        properties = properties.filter(property_type__icontains=property_type)
        filters_applied = True
        logger.info(f"After property type filter: {properties.count()} properties")
    
    # Extract room count
    room_count = extract_room_count(query_lower)
    if room_count:
        logger.info(f"Found room count: {room_count}")
        properties = properties.filter(number_of_rooms=room_count)
        filters_applied = True
        logger.info(f"After room count filter: {properties.count()} properties")
    
    # Extract price range
    price_filters = extract_price_range(query_lower)
    if price_filters:
        logger.info(f"Found price filters: {price_filters}")
        properties = properties.filter(**price_filters)
        filters_applied = True
        logger.info(f"After price filter: {properties.count()} properties")
    
    # If no specific filters found, do keyword search
    if not filters_applied:
        logger.info("No specific filters found, doing keyword search")
        properties = properties.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(city__icontains=query) |
            Q(address__icontains=query)
        )
        logger.info(f"After keyword search: {properties.count()} properties")
    
    result_count = properties.count()
    logger.info(f"Final result count: {result_count} properties")
    
    return properties.order_by('-created_at')[:8]


def extract_locations(query):
    """Extract German city names from query - FIXED for better matching"""
    german_cities = [
        'berlin', 'munich', 'münchen', 'hamburg', 'frankfurt', 'cologne', 'köln',
        'stuttgart', 'düsseldorf', 'dortmund', 'essen', 'leipzig', 'bremen',
        'dresden', 'hannover', 'nuremberg', 'nürnberg', 'meiningen'
    ]
    
    found_locations = []
    
    # FIXED: Check for exact word matches, not just substring
    words = query.split()
    for word in words:
        # Clean the word (remove punctuation)
        clean_word = re.sub(r'[^\w\s]', '', word.lower())
        if clean_word in german_cities:
            found_locations.append(clean_word)
    
    # Also check for multi-word cities (like "frankfurt am main")
    for city in german_cities:
        if city in query and city not in found_locations:
            found_locations.append(city)
    
    logger.info(f"Extracted locations from '{query}': {found_locations}")
    return list(set(found_locations))


def extract_property_type(query):
    """Extract property type from query"""
    property_types = {
        'apartment': ['apartment', 'flat', 'wohnung'],
        'house': ['house', 'haus', 'villa'],
        'studio': ['studio'],
        'penthouse': ['penthouse'],
        'commercial': ['commercial', 'office', 'büro']
    }
    
    words = query.split()
    for word in words:
        clean_word = re.sub(r'[^\w\s]', '', word.lower())
        for prop_type, keywords in property_types.items():
            if clean_word in keywords:
                return prop_type
    
    # Also check for substrings
    for prop_type, keywords in property_types.items():
        for keyword in keywords:
            if keyword in query:
                return prop_type
    return None


def extract_room_count(query):
    """Extract number of rooms from query"""
    # Look for patterns like "2 bedroom", "3 rooms", etc.
    room_patterns = [
        r'(\d+)\s*bedroom',
        r'(\d+)\s*room',
        r'(\d+)\s*zimmer',
        r'(\d+)\s*bed',
        r'(\d+)\s*room',
    ]
    
    for pattern in room_patterns:
        match = re.search(pattern, query)
        if match:
            return int(match.group(1))
    
    return None


def extract_price_range(query):
    """Extract price range from query"""
    # Look for patterns like "under 500", "500-1000", "500 to 1000"
    price_filters = {}
    
    # Under certain price (e.g., "under 500", "less than 1000")
    under_match = re.search(r'(under|less than)\s*(\d+[,.]?\d*)', query)
    if under_match:
        price_str = under_match.group(2).replace(',', '').replace('.', '')
        try:
            price_filters['price__lte'] = int(price_str)
        except ValueError:
            pass
    
    # Over certain price (e.g., "over 500", "more than 1000")
    over_match = re.search(r'(over|more than)\s*(\d+[,.]?\d*)', query)
    if over_match:
        price_str = over_match.group(2).replace(',', '').replace('.', '')
        try:
            price_filters['price__gte'] = int(price_str)
        except ValueError:
            pass
    
    # Price range (e.g., "500-1000", "500 to 1000")
    range_match = re.search(r'(\d+[,.]?\d*)\s*[-–—]\s*(\d+[,.]?\d*)', query)
    if range_match:
        min_price = range_match.group(1).replace(',', '').replace('.', '')
        max_price = range_match.group(2).replace(',', '').replace('.', '')
        try:
            price_filters['price__gte'] = int(min_price)
            price_filters['price__lte'] = int(max_price)
        except ValueError:
            pass
    
    # "to" pattern (e.g., "500 to 1000")
    to_match = re.search(r'(\d+[,.]?\d*)\s*to\s*(\d+[,.]?\d*)', query)
    if to_match:
        min_price = to_match.group(1).replace(',', '').replace('.', '')
        max_price = to_match.group(2).replace(',', '').replace('.', '')
        try:
            price_filters['price__gte'] = int(min_price)
            price_filters['price__lte'] = int(max_price)
        except ValueError:
            pass
    
    return price_filters


def create_property_context(properties):
    """Create a formatted string of properties for AI context"""
    if not properties:
        return "No properties found matching the criteria."
    
    context = f"Found {len(properties)} properties:\n"
    for i, prop in enumerate(properties, 1):
        context += f"{i}. {prop.name} in {prop.city} - €{prop.price:,}\n"
        context += f"   {prop.number_of_rooms} rooms, {prop.size} m², {prop.property_type}\n"
        if prop.description:
            # Take first 100 chars of description
            desc = prop.description[:100] + "..." if len(prop.description) > 100 else prop.description
            context += f"   Description: {desc}\n"
        context += "\n"
    
    return context

# Keep all your other existing functions below...
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