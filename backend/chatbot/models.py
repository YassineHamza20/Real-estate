# chatbot/models.py
from django.db import models
from django.conf import settings

class ChatSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,# Reference to the Django User model
        on_delete=models.CASCADE,
        related_name='chat_sessions'  # Allows accessing sessions via user.chat_sessions
    )
    session_id = models.CharField(max_length=100, unique=True)   # Maximum length for session identifier & # Ensures no duplicate session IDs
    created_at = models.DateTimeField(auto_now_add=True)      # Automatically set when session is created
    updated_at = models.DateTimeField(auto_now=True)  # Automatically updated every time session is saved

    def __str__(self):
        return f"Chat session for {self.user.username}"

class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),   # Message sent by the user
        ('assistant', 'Assistant'),  # Message sent by the AI assistant
    ]
    
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE, # Delete all messages when session is deleted
        related_name='messages'     # Access messages via session.messages
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)   # Restricts input to defined choices
     # The actual text content of the message
    content = models.TextField()     # Use TextField for potentially long messages
  
    timestamp = models.DateTimeField(auto_now_add=True) # Automatically set when message is created
    response_time = models.FloatField(null=True, blank=True)  # Time taken by AI to respond in seconds  

    class Meta:
        ordering = ['timestamp']  # Default ordering: oldest to newest

    def __str__(self):  
        return f"{self.role}: {self.content[:50]}..."  # Show first 50 chars of message