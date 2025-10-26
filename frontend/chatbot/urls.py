from django.urls import path
from . import views

urlpatterns = [
    path('send-message/', views.send_message, name='send-chat-message'),
    path('rate-limit-status/', views.get_rate_limit_status, name='rate-limit-status'),
    path('test-gemini/', views.test_gemini, name='test-gemini'),
    path('sessions/', views.list_chat_sessions, name='list-chat-sessions'),
    path('sessions/<str:session_id>/', views.get_chat_history, name='get-chat-history'),
    path('sessions/<str:session_id>/export/', views.export_conversation, name='export-conversation'),
    path('sessions/<str:session_id>/delete/', views.delete_chat_session, name='delete-chat-session'),
    path('list-models/', views.list_models, name='list-models'),
]