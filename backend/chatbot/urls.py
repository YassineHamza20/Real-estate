# chatbot/urls.py
from django.urls import path
from . import views

# URL patterns for the chatbot application
# Each path maps a URL endpoint to a specific view function
urlpatterns = [
    # Send a message to the AI assistant and get a response
    path('send-message/', views.send_message, name='send-chat-message'),
    
    # Check the current rate limit status for the user
    path('rate-limit-status/', views.get_rate_limit_status, name='rate-limit-status'),
    
    # Test endpoint to verify Gemini API connectivity (for debugging/administration)
    path('test-gemini/', views.test_gemini, name='test-gemini'),
    
    # List all chat sessions for the authenticated user
    path('sessions/', views.list_chat_sessions, name='list-chat-sessions'),
    
    # Retrieve chat history for a specific session by its session_id
    # <str:session_id> is a URL parameter that captures the session identifier
    path('sessions/<str:session_id>/', views.get_chat_history, name='get-chat-history'),
    
    # Export conversation from a specific session (e.g., to PDF, TXT, or JSON format)
    #path('sessions/<str:session_id>/export/', views.export_conversation, name='export-conversation'),
    
    # Delete a specific chat session and all its associated messages
    path('sessions/<str:session_id>/delete/', views.delete_chat_session, name='delete-chat-session'),
    
    # List available AI models that can be used for chat (for model selection/settings)
    path('list-models/', views.list_models, name='list-models'),
]