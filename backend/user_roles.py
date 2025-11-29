import matplotlib.pyplot as plt
import matplotlib.patches as patches

def create_role_diagram():
    fig, ax = plt.subplots(1, 1, figsize=(12, 8))
    
    roles_data = {
        'Buyer': {
            'color': '#FF6B6B',
            'permissions': [
                "Browse all properties",
                "Filter and search properties", 
                "Save properties to wishlist",
                "Contact sellers via chat",
                "Schedule property visits",
                "View property details & images"
            ]
        },
        'Seller': {
            'color': '#4ECDC4', 
            'permissions': [
                "List new properties",
                "Manage property listings",
                "Upload property images",
                "Respond to buyer inquiries",
                "Update property availability",
                "View inquiry analytics"
            ]
        },
        'Admin': {
            'color': '#45B7D1',
            'permissions': [
                "Manage all user accounts",
                "Verify seller documents", 
                "Monitor all property listings",
                "Generate system reports",
                "Manage platform content",
                "System configuration"
            ]
        }
    }
    
    # Draw role boxes
    y_pos = 7
    for role, data in roles_data.items():
        # Role header
        header_rect = patches.Rectangle((1, y_pos-0.3), 4, 0.6, 
                                      linewidth=2, edgecolor='black',
                                      facecolor=data['color'], alpha=0.9)
        ax.add_patch(header_rect)
        ax.text(3, y_pos, role, fontsize=14, weight='bold', 
               ha='center', va='center', color='white')
        
        # Permissions box
        perm_rect = patches.Rectangle((1, y_pos-2.0), 4, 1.5,
                                    linewidth=1, edgecolor='gray',
                                    facecolor='white', alpha=0.9)
        ax.add_patch(perm_rect)
        
        # Permissions text
        perm_y = y_pos - 0.8
        for perm in data['permissions']:
            ax.text(1.2, perm_y, f"• {perm}", fontsize=9, ha='left', va='center')
            perm_y -= 0.25
        
        y_pos -= 3
    
    ax.set_xlim(0, 6)
    ax.set_ylim(0, 8)
    ax.set_aspect('equal')
    ax.axis('off')
    plt.title('User Roles and Permissions Matrix', size=16, weight='bold', pad=20)
    plt.tight_layout()
    plt.savefig('umls/user_roles.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("✅ User roles diagram saved to umls/user_roles.png")

if __name__ == "__main__":
    create_role_diagram()