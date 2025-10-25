import google.generativeai as genai
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class GeminiChatService:
    def __init__(self):
        self.api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not self.api_key or self.api_key == 'your-actual-api-key-here':
            raise ValueError("GEMINI_API_KEY not properly configured in settings")
        self.configure_gemini()
    
    def configure_gemini(self):
        """Configure Gemini AI with the best available model"""
        try:
            genai.configure(api_key=self.api_key)
            
            # Try models in order of preference (all free)
            preferred_models = [
                'gemini-2.0-flash',      # Best choice - fast and free
                'gemini-2.0-flash-lite', # Lightweight alternative  
                'gemini-1.5-flash',      # Good fallback
                'models/gemini-pro',     # Legacy format
            ]
            
            self.model = None
            successful_model = None
            
            for model_name in preferred_models:
                try:
                    logger.info(f"Attempting to initialize: {model_name}")
                    self.model = genai.GenerativeModel(model_name)
                    # Quick test to verify it works
                    test_response = self.model.generate_content("Test")
                    successful_model = model_name
                    logger.info(f"✅ Successfully configured: {model_name}")
                    break
                except Exception as e:
                    logger.warning(f"❌ Model {model_name} failed: {str(e)}")
                    continue
            
            if not self.model:
                # Last resort: list all models and use first available
                try:
                    all_models = genai.list_models()
                    for model in all_models:
                        if 'generateContent' in model.supported_generation_methods:
                            self.model = genai.GenerativeModel(model.name)
                            successful_model = model.name
                            logger.info(f"🔄 Using available model: {model.name}")
                            break
                except Exception as e:
                    logger.error(f"Failed to list models: {e}")
            
            if not self.model:
                raise Exception("Could not initialize any Gemini model")
                
            logger.info(f"🎯 Final model selected: {successful_model}")
            
        except Exception as e:
            logger.error(f"Gemini configuration completely failed: {str(e)}")
            raise
    
    def generate_response(self, user_message, conversation_history=None):
        """Generate AI response for general queries"""
        try:
            # General purpose context
            context = """You are a helpful AI assistant. You help users with:
            - Answering questions on any topic
            - Providing information and explanations
            - Creative tasks and brainstorming
            - Problem-solving and advice
            - Learning and educational support
            
            Be friendly, knowledgeable, and helpful. Provide accurate, thoughtful responses.
            If you don't know something, admit it honestly."""

            # Build conversation context
            if conversation_history:
                history_text = "\n".join([
                    f"{msg['role']}: {msg['content']}" 
                    for msg in conversation_history[-6:]  # Keep more context
                ])
                prompt = f"{context}\n\nConversation history:\n{history_text}\n\nUser: {user_message}\nAssistant:"
            else:
                prompt = f"{context}\n\nUser: {user_message}\nAssistant:"
            
            # Generate response with more creative freedom
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.8,  # Slightly more creative
                    top_p=0.9,
                    top_k=40,
                    max_output_tokens=800,  # Allow longer responses
                )
            )
            
            return {
                'success': True,
                'response': response.text,
            }
            
        except Exception as e:
            logger.error(f"Generation error: {str(e)}")
            return {
                'success': False,
                'error': f"Sorry, I'm having trouble responding right now. Please try again.",
                'response': None
            }