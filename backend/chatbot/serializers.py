# chatbot/serializers.py
from rest_framework import serializers
from .models import ChatSession, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    """
    Serializer for ChatMessage model.
    Converts ChatMessage model instances to JSON format for API responses,
    and validates JSON data back to model instances.
    """
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'timestamp']  # Only expose these fields via API


class ChatSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for ChatSession model with nested messages.
    Includes all messages belonging to the session in the serialized output.
    """
    messages = ChatMessageSerializer(many=True, read_only=True)  # Nested serializer for related messages
    
    class Meta:
        model = ChatSession
        fields = ['id', 'session_id', 'created_at', 'updated_at', 'messages']  # Include messages in output


class ChatRequestSerializer(serializers.Serializer):
    """
    Serializer for validating incoming chat requests.
    This is NOT a ModelSerializer - it's used for validating request data structure.
    """
    message = serializers.CharField(
        required=True,  # This field is mandatory
        # Allows validation of the incoming message content
    )
    session_id = serializers.CharField(
        required=False,   # This field is optional
        allow_blank=True,  # Allows empty string as valid input
        # If session_id is provided, continue existing conversation
        # If not provided, create a new session
    )
    
    # Note: This serializer doesn't create model instances directly
    # It's used to validate the structure of incoming POST/PUT request data
    # before processing in the view