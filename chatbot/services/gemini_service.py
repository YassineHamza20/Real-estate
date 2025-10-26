import google.generativeai as genai
from django.conf import settings
import logging
import re
import json
from properties.models import Property, PropertyImage

logger = logging.getLogger(__name__)

class GeminiChatService:
    def __init__(self):
        self.api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not configured in settings")
        self.configure_gemini()
    
    def configure_gemini(self):
        """Configure Gemini AI"""
        try:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')
            logger.info("Gemini AI configured successfully")
        except Exception as e:
            logger.error(f"Gemini configuration failed: {str(e)}")
            raise
    
    def extract_property_criteria(self, user_message):
        """Extract property search criteria from user message"""
        try:
            extraction_prompt = f"""Extract real estate search criteria from this German property search. Return as JSON:
            - max_price (number) - in Euros if mentioned
            - min_price (number) - in Euros  
            - city (string) - German cities like Berlin, Munich, Hamburg, Frankfurt, Cologne
            - min_rooms (number)
            - property_type (string: house, apartment, villa, land, commercial)
            - min_size (number) - in square meters
            
            Message: "{user_message}"
            
            Return ONLY valid JSON:"""
            
            response = self.model.generate_content(extraction_prompt)
            criteria_text = response.text.strip()
            criteria_text = re.sub(r'^```json\s*|\s*```$', '', criteria_text)
            criteria = json.loads(criteria_text)
            
            logger.info(f"Extracted criteria: {criteria}")
            return criteria
            
        except Exception as e:
            logger.error(f"Criteria extraction failed: {e}")
            return {}
    
    def search_properties(self, criteria):
        """Search properties in YOUR German properties database"""
        try:
            queryset = Property.objects.filter(is_available=True)
            
            # Apply filters for German property search
            if criteria.get('max_price'):
                queryset = queryset.filter(price__lte=criteria['max_price'])
            if criteria.get('min_price'):
                queryset = queryset.filter(price__gte=criteria['min_price'])
            if criteria.get('city'):
                # Search for German cities in your database
                queryset = queryset.filter(city__icontains=criteria['city'])
            if criteria.get('min_rooms'):
                queryset = queryset.filter(number_of_rooms__gte=criteria['min_rooms'])
            if criteria.get('property_type'):
                queryset = queryset.filter(property_type=criteria['property_type'])
            if criteria.get('min_size'):
                queryset = queryset.filter(size__gte=criteria['min_size'])
            
            properties = queryset.select_related('seller').prefetch_related('images')[:5]
            logger.info(f"Found {len(properties)} German properties matching criteria")
            return properties
            
        except Exception as e:
            logger.error(f"Property search failed: {e}")
            return []
    
    def format_properties_for_ai(self, properties):
        """Format German properties for AI presentation"""
        if not properties:
            return "No properties found in Germany matching your criteria."
        
        formatted = []
        for i, prop in enumerate(properties, 1):
            # Get primary image
            primary_image = prop.images.filter(is_primary=True).first()
            image_info = f"📷 [Image available]" if primary_image else ""
            
            # Format for German properties in Euros
            property_info = f"""
{i}. **{prop.name}**
   - 💰 Price: {prop.price} €
   - 📍 Location: {prop.city}, Germany
   - 🏠 Type: {prop.get_property_type_display()}
   - 🛏️ Rooms: {prop.number_of_rooms}
   - 📏 Size: {prop.size} m²
   - 📝 {prop.description[:100]}...
   - {image_info}
"""
            formatted.append(property_info)
        
        return "\n".join(formatted)
    
    def generate_response(self, user_message, conversation_history=None):
        """Generate AI response with German property database integration"""
        try:
            # Check if this is a property search query
            is_property_search = any(keyword in user_message.lower() for keyword in [
                'property', 'house', 'apartment', 'villa', 'wohnung', 'haus',
                'buy', 'purchase', 'kaufen', 'find', 'search', 'suchen',
                'budget', 'price', 'preis', 'cost', 'kosten'
            ])
            
            base_context = """You are EstateAI, a helpful real estate assistant for German properties. 
            You help users find properties in Germany (Berlin, Munich, Hamburg, Frankfurt, etc.). 
            All prices are in Euros (€). Be friendly and professional."""
            
            database_results = ""
            properties_found = False
            
            # If it's a property search, integrate database results
            if is_property_search:
                criteria = self.extract_property_criteria(user_message)
                if criteria:
                    properties = self.search_properties(criteria)
                    database_results = self.format_properties_for_ai(properties)
                    properties_found = len(properties) > 0
                    
                    if properties_found:
                        base_context += f"""
                        
IMPORTANT: I found these actual German properties from our database:
{database_results}

Please present these specific properties to the user. Help them compare options and suggest which might be best for their needs.
"""
                    else:
                        base_context += "\n\nNo German properties found matching your criteria. Suggest adjusting the search parameters or expanding the search to other German cities."
            
            # Build conversation context
            if conversation_history:
                history_text = "\n".join([
                    f"{msg['role']}: {msg['content']}" 
                    for msg in conversation_history[-4:]
                ])
                prompt = f"{base_context}\n\nConversation history:\n{history_text}\n\nUser: {user_message}\nEstateAI:"
            else:
                prompt = f"{base_context}\n\nUser: {user_message}\nEstateAI:"
            
            # Generate response
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=1000,
                )
            )
            
            return {
                'success': True,
                'response': response.text,
                'properties_found': properties_found
            }
            
        except Exception as e:
            logger.error(f"Generation error: {str(e)}")
            return {
                'success': False,
                'error': f"Sorry, I'm having trouble responding right now. Please try again.",
                'response': None
            }