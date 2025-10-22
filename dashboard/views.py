# dashboard/views.py
from django.shortcuts import render
from django.utils import timezone
from django.db.models import Count, Q
from django.http import JsonResponse
from users.models import User, SellerVerification
from properties.models import Property, Wishlist
from datetime import datetime, timedelta
import json
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO

from django.shortcuts import render
from django.utils import timezone
from django.db.models import Count, Q, Avg, Max, Min, Sum
from django.http import JsonResponse, HttpResponse
from users.models import User, SellerVerification
from properties.models import Property, Wishlist
from datetime import datetime, timedelta
import json 

def admin_dashboard(request):
    try:
        # Basic counts
        total_users = User.objects.count()
        total_buyers = User.objects.filter(role='buyer').count()
        total_sellers = User.objects.filter(role='seller').count()
        total_admins = User.objects.filter(role='admin').count()
        total_properties = Property.objects.count()
        total_wishlists = Wishlist.objects.count()
        
        # Seller verification
        verified_sellers = SellerVerification.objects.filter(status='approved').count()
        pending_verifications = SellerVerification.objects.filter(status='pending').count()
        unsubmitted_sellers = max(0, total_sellers - (verified_sellers + pending_verifications))
        
        # Property types distribution
        property_types_data = Property.objects.values('property_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        property_type_labels = [item['property_type'].title() for item in property_types_data]
        property_type_counts = [item['count'] for item in property_types_data]
        
        # Cities data
        cities_data = Property.objects.values('city').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        city_labels = [item['city'] or 'Unknown' for item in cities_data]
        city_counts = [item['count'] for item in cities_data]
        
        # Rooms distribution
        rooms_data = Property.objects.values('number_of_rooms').annotate(
            count=Count('id')
        ).order_by('number_of_rooms')
        
        room_labels = []
        room_counts = []
        for item in rooms_data:
            room_labels.append(f"{item['number_of_rooms']} Room{'s' if item['number_of_rooms'] > 1 else ''}")
            room_counts.append(item['count'])
        
        # Recent properties with wishlist counts
        recent_properties = Property.objects.select_related('seller').annotate(
            wishlist_count=Count('wishlisted_by')
        ).order_by('-created_at')[:10]
        
        # Most wishlisted properties
        most_wishlisted = Property.objects.annotate(
            wishlist_count=Count('wishlisted_by')
        ).filter(wishlist_count__gt=0).order_by('-wishlist_count')[:10]

        context = {
            'current_time': timezone.now().strftime('%H:%M:%S'),
            'total_users': total_users,
            'total_buyers': total_buyers,
            'total_sellers': total_sellers,
            'total_admins': total_admins,
            'total_properties': total_properties,
            'total_wishlists': total_wishlists,
            'verified_sellers': verified_sellers,
            'pending_verifications': pending_verifications,
            'unsubmitted_sellers': unsubmitted_sellers,
            
            # Chart data
            'property_types_labels': property_type_labels,
            'property_types_data': property_type_counts,
            'cities_labels': city_labels,
            'cities_data': city_counts,
            'rooms_labels': room_labels,
            'rooms_data': room_counts,
            
            # Table data
            'recent_properties': recent_properties,
            'most_wishlisted': most_wishlisted,
        }
        
        return render(request, 'dashboard/admin_dashboard.html', context)
    
    except Exception as e:
        print(f"Dashboard error: {e}")
        # Return basic context even if there's an error
        return render(request, 'dashboard/admin_dashboard.html', {
            'total_users': 0,
            'total_buyers': 0,
            'total_sellers': 0,
            'total_admins': 0,
            'total_properties': 0,
            'total_wishlists': 0,
            'verified_sellers': 0,
            'pending_verifications': 0,
            'unsubmitted_sellers': 0,
            'property_types_labels': [],
            'property_types_data': [],
            'cities_labels': [],
            'cities_data': [],
            'rooms_labels': [],
            'rooms_data': [],
            'recent_properties': [],
            'most_wishlisted': [],
        })

def dashboard_api(request):
    """Simple API endpoint for real-time data"""
    try:
        data = {
            'total_buyers': User.objects.filter(role='buyer').count(),
            'total_sellers': User.objects.filter(role='seller').count(),
            'total_admins': User.objects.filter(role='admin').count(),
            'total_properties': Property.objects.count(),
            'total_wishlists': Wishlist.objects.count(),
            'timestamp': timezone.now().isoformat()
        }
        return JsonResponse(data)
    except:
        return JsonResponse({'error': 'API temporarily unavailable'}, status=500)
    

def export_dashboard_pdf(request):
    """Export complete dashboard data as PDF"""
    try:
        # Create PDF buffer with better margins
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )
        elements = []
        styles = getSampleStyleSheet()
        
        # Professional Header
        title = Paragraph("REAL ESTATE ANALYTICS REPORT", styles['Title'])
        elements.append(title)
        
        # Report metadata
        date_str = Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y at %H:%M')}", styles['Normal'])
        elements.append(date_str)
        elements.append(Spacer(1, 25))
        
        # Get comprehensive data
        total_users = User.objects.count()
        total_buyers = User.objects.filter(role='buyer').count()
        total_sellers = User.objects.filter(role='seller').count()
        total_admins = User.objects.filter(role='admin').count()
        total_properties = Property.objects.count()
        total_wishlists = Wishlist.objects.count()
        
        # Price statistics
        price_stats = Property.objects.aggregate(
            avg_price=Avg('price'),
            max_price=Max('price'),
            min_price=Min('price')
        )
        
        # Seller verification stats
        verified_sellers = SellerVerification.objects.filter(status='approved').count()
        pending_verifications = SellerVerification.objects.filter(status='pending').count()
        
        # Property type distribution
        property_types = Property.objects.values('property_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Recent activity
        new_users_week = User.objects.filter(
            date_joined__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        new_properties_week = Property.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        # EXECUTIVE SUMMARY SECTION
        elements.append(Paragraph("EXECUTIVE SUMMARY", styles['Heading2']))
        
        summary_data = [
            ['PLATFORM OVERVIEW', 'STATISTICS'],
            ['Total Users', f"{total_users:,}"],
            ['Active Buyers', f"{total_buyers:,}"],
            ['Verified Sellers', f"{verified_sellers:,}"],
            ['Total Properties', f"{total_properties:,}"],
            ['Wishlist Engagements', f"{total_wishlists:,}"],
            ['New Users (7 days)', f"{new_users_week:,}"],
            ['New Properties (7 days)', f"{new_properties_week:,}"],
        ]
        
        summary_table = Table(summary_data, colWidths=[200, 100])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))
        
        # PRICE ANALYTICS SECTION
        elements.append(Paragraph("PRICE ANALYTICS", styles['Heading2']))
        
        price_data = [
            ['PRICE METRIC', 'AMOUNT (DH)'],
            ['Average Property Price', f"{price_stats['avg_price'] or 0:,.2f}"],
            ['Most Expensive Property', f"{price_stats['max_price'] or 0:,.2f}"],
            ['Most Affordable Property', f"{price_stats['min_price'] or 0:,.2f}"],
        ]
        
        price_table = Table(price_data, colWidths=[180, 120])
        price_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0fdf4')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1fae5')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
        ]))
        elements.append(price_table)
        elements.append(Spacer(1, 20))
        
        # PROPERTY TYPE BREAKDOWN SECTION
        elements.append(Paragraph("PROPERTY TYPE DISTRIBUTION", styles['Heading2']))
        
        if property_types:
            property_type_data = [['PROPERTY TYPE', 'COUNT', 'PERCENTAGE']]
            total_props = sum(item['count'] for item in property_types)
            
            for item in property_types:
                percentage = (item['count'] / total_props * 100) if total_props > 0 else 0
                property_type_data.append([
                    item['property_type'].title(),
                    str(item['count']),
                    f"{percentage:.1f}%"
                ])
            
            property_type_table = Table(property_type_data, colWidths=[120, 60, 80])
            property_type_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b5cf6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#faf5ff')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#ddd6fe')),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ]))
            elements.append(property_type_table)
        else:
            elements.append(Paragraph("No property type data available", styles['Normal']))
        
        elements.append(Spacer(1, 20))
        
        # RECENT PROPERTIES SECTION
        elements.append(Paragraph("RECENT PROPERTY LISTINGS", styles['Heading2']))
        
        recent_properties = Property.objects.select_related('seller').annotate(
            wishlist_count=Count('wishlisted_by')
        ).order_by('-created_at')[:15]
        
        if recent_properties:
            property_data = [['PROPERTY', 'CITY', 'PRICE (DH)', 'TYPE', 'ROOMS', 'WISHLISTS']]
            
            for prop in recent_properties:
                property_data.append([
                    prop.name[:20] + '...' if len(prop.name) > 20 else prop.name,
                    prop.city[:12] if prop.city else 'N/A',
                    f"{prop.price:,.2f}",
                    prop.property_type[:8].title(),
                    str(prop.number_of_rooms),
                    str(prop.wishlist_count)
                ])
            
            property_table = Table(property_data, colWidths=[100, 60, 70, 50, 40, 50])
            property_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f59e0b')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#fffbeb')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#fed7aa')),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fffbeb')]),
            ]))
            elements.append(property_table)
        else:
            elements.append(Paragraph("No recent properties available", styles['Normal']))
        
        elements.append(Spacer(1, 20))
        
        # SELLER VERIFICATION STATUS
        elements.append(Paragraph("SELLER VERIFICATION STATUS", styles['Heading2']))
        
        verification_data = [
            ['STATUS', 'COUNT'],
            ['Verified Sellers', str(verified_sellers)],
            ['Pending Verification', str(pending_verifications)],
            ['Total Sellers', str(total_sellers)],
        ]
        
        verification_table = Table(verification_data, colWidths=[150, 80])
        verification_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ef4444')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#fef2f2')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#fecaca')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
        ]))
        elements.append(verification_table)
        
        # FOOTER
        elements.append(Spacer(1, 30))
        elements.append(Paragraph("--- End of Report ---", styles['Normal']))
        elements.append(Paragraph("Confidential Business Document - For Internal Use Only", styles['Normal']))
        
        # Build PDF
        doc.build(elements)
        
        # Prepare response with better filename
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        filename = f"RealEstate_Dashboard_Report_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return HttpResponse(f"Error generating PDF: {str(e)}")