# properties/management/commands/create_sample_data.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from properties.models import Property, PropertyImage
from users.models import SellerVerification
import random
from datetime import datetime, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample data for testing analytics'

    def handle(self, *args, **options):
        # Create sample users
        buyer1 = User.objects.create_user(
            username='buyer1',
            email='buyer1@test.com',
            password='test123',
            role='buyer',
            phone_number='+212600000001'
        )
        
        buyer2 = User.objects.create_user(
            username='buyer2', 
            email='buyer2@test.com',
            password='test123',
            role='buyer',
            phone_number='+212600000002'
        )

        seller1 = User.objects.create_user(
            username='seller1',
            email='seller1@test.com', 
            password='test123',
            role='seller',
            phone_number='+212600000003'
        )

        seller2 = User.objects.create_user(
            username='seller2',
            email='seller2@test.com',
            password='test123', 
            role='seller',
            phone_number='+212600000004'
        )

        # Create seller verifications (approved)
        SellerVerification.objects.create(
            user=seller1,
            status='approved'
        )
        
        SellerVerification.objects.create(
            user=seller2, 
            status='approved'
        )

        # Sample property data
        cities = ['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Agadir']
        property_types = ['villa', 'apartment', 'house', 'commercial']
        
        properties_data = [
            {
                'name': 'Luxury Villa in Casablanca',
                'description': 'Beautiful modern villa with pool',
                'address': '123 Palm Street, Anfa',
                'city': 'Casablanca',
                'price': 3500000,
                'rooms': 5,
                'size': 400,
                'type': 'villa',
                'seller': seller1
            },
            {
                'name': 'Modern Apartment in Rabat',
                'description': 'New apartment in city center',
                'address': '45 Hassan II Avenue',
                'city': 'Rabat', 
                'price': 1200000,
                'rooms': 3,
                'size': 95,
                'type': 'apartment',
                'seller': seller2
            },
            {
                'name': 'Traditional House in Marrakech',
                'description': 'Authentic Moroccan house in Medina',
                'address': 'Medina Quarter',
                'city': 'Marrakech',
                'price': 850000,
                'rooms': 4, 
                'size': 180,
                'type': 'house',
                'seller': seller1
            },
            {
                'name': 'Beach Villa in Agadir',
                'description': 'Villa with sea view',
                'address': 'Beach Road',
                'city': 'Agadir',
                'price': 2800000,
                'rooms': 6,
                'size': 350,
                'type': 'villa', 
                'seller': seller2
            },
            {
                'name': 'Commercial Space in Casablanca',
                'description': 'Prime location for business',
                'address': 'City Center',
                'city': 'Casablanca',
                'price': 4200000,
                'rooms': 2,
                'size': 300,
                'type': 'commercial',
                'seller': seller1
            },
            {
                'name': 'Garden House in Rabat',
                'description': 'House with large garden',
                'address': 'Souissi District',
                'city': 'Rabat',
                'price': 1900000,
                'rooms': 4,
                'size': 220,
                'type': 'house',
                'seller': seller2
            }
        ]

        # Create properties with different dates to show monthly trends
        for i, prop_data in enumerate(properties_data):
            # Create properties with different creation dates
            days_ago = random.randint(0, 180)  # Some properties created in last 6 months
            created_date = datetime.now() - timedelta(days=days_ago)
            
            property_obj = Property.objects.create(
                name=prop_data['name'],
                description=prop_data['description'],
                address=prop_data['address'],
                city=prop_data['city'],
                price=prop_data['price'],
                number_of_rooms=prop_data['rooms'],
                size=prop_data['size'],
                property_type=prop_data['type'],
                seller=prop_data['seller'],
                created_at=created_date
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Created property: {property_obj.name}')
            )

        self.stdout.write(
            self.style.SUCCESS('Successfully created sample data!')
        )