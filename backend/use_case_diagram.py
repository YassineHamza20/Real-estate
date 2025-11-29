import matplotlib.pyplot as plt
import matplotlib.patches as patches

def draw_stick_figure(ax, x, y, label, color='blue'):
    """Draw a stick figure actor"""
    # Head
    head = patches.Circle((x, y), 0.3, facecolor=color, alpha=0.7)
    ax.add_patch(head)
    
    # Body
    ax.plot([x, x], [y-0.3, y-1.2], 'k-', lw=2)
    
    # Arms
    ax.plot([x-0.4, x+0.4], [y-0.6, y-0.6], 'k-', lw=2)
    
    # Legs
    ax.plot([x, x-0.3], [y-1.2, y-1.8], 'k-', lw=2)
    ax.plot([x, x+0.3], [y-1.2, y-1.8], 'k-', lw=2)
    
    # Label
    ax.text(x, y-2.2, label, fontsize=12, weight='bold', ha='center')

def create_proper_use_case_diagram():
    fig, ax = plt.subplots(1, 1, figsize=(18, 14))
    
    # Position actors with more space
    draw_stick_figure(ax, 3, 10, 'Buyer', '#4CAF50')
    draw_stick_figure(ax, 3, 6, 'Seller', '#FF9800')
    draw_stick_figure(ax, 15, 8, 'Administrator', '#F44336')
    
    # ===== USE CASES WITH NARROWER CIRCLES AND MORE SPACING =====
    
    # Common use cases (All Users)
    common_cases = [
        ("Authenticate", (7, 12)),
        ("Manage Profile", (7, 10.5)),
        ("Use Chatbot", (7, 9))
    ]
    
    # Buyer essential functions
    buyer_cases = [
        ("Browse Properties", (10, 12)),
        ("Search Properties", (10, 10.5)),
        ("Manage Wishlist", (10, 9)),
        ("View Property Details", (10, 7.5)),
        ("Contact Seller", (10, 6)),
        ("Request Seller Role", (10, 4.5))
    ]
    
    # Seller essential functions
    seller_cases = [
        ("Manage Properties", (10, 3)),
        ("Track Verification", (10, 1.5))
    ]
    
    # Admin essential functions
    admin_cases = [
        ("Manage Users", (13, 12)),
        ("Manage Properties", (13, 10.5)),
        ("Process Verifications", (13, 9)),
        ("View Analytics", (13, 7.5))
    ]
    
    # Draw use cases with NARROWER ovals (less width)
    # Common use cases
    for use_case, pos in common_cases:
        oval = patches.Ellipse(pos, 3.5, 0.9, linewidth=1, edgecolor='black', 
                             facecolor='white', alpha=0.9)  # Width reduced from 5.0 to 3.5
        ax.add_patch(oval)
        ax.text(pos[0], pos[1], use_case, fontsize=9, ha='center', va='center')  # Smaller font
    
    # Buyer use cases
    for use_case, pos in buyer_cases:
        oval = patches.Ellipse(pos, 3.5, 0.9, linewidth=1, edgecolor='black', 
                             facecolor='white', alpha=0.9)  # Width reduced from 5.0 to 3.5
        ax.add_patch(oval)
        ax.text(pos[0], pos[1], use_case, fontsize=9, ha='center', va='center')  # Smaller font
    
    # Seller use cases
    for use_case, pos in seller_cases:
        oval = patches.Ellipse(pos, 3.5, 0.9, linewidth=1, edgecolor='black', 
                             facecolor='white', alpha=0.9)  # Width reduced from 5.0 to 3.5
        ax.add_patch(oval)
        ax.text(pos[0], pos[1], use_case, fontsize=9, ha='center', va='center')  # Smaller font
    
    # Admin use cases
    for use_case, pos in admin_cases:
        oval = patches.Ellipse(pos, 3.5, 0.9, linewidth=1, edgecolor='black', 
                             facecolor='white', alpha=0.9)  # Width reduced from 5.0 to 3.5
        ax.add_patch(oval)
        ax.text(pos[0], pos[1], use_case, fontsize=9, ha='center', va='center')  # Smaller font
    
    # ===== CLEAN RELATIONSHIPS =====
    
    # Buyer associations
    buyer_x, buyer_y = 3, 10
    for use_case, pos in common_cases:
        ax.plot([buyer_x + 0.5, pos[0] - 1.75], [buyer_y, pos[1]], 'k-', lw=1)  # Adjusted for narrower ovals
    for use_case, pos in buyer_cases:
        ax.plot([buyer_x + 0.5, pos[0] - 1.75], [buyer_y, pos[1]], 'k-', lw=1)  # Adjusted for narrower ovals
    
    # Seller associations
    seller_x, seller_y = 3, 6
    for use_case, pos in common_cases:
        ax.plot([seller_x + 0.5, pos[0] - 1.75], [seller_y, pos[1]], 'k-', lw=1)  # Adjusted for narrower ovals
    for use_case, pos in seller_cases:
        ax.plot([seller_x + 0.5, pos[0] - 1.75], [seller_y, pos[1]], 'k-', lw=1)  # Adjusted for narrower ovals
    
    # Admin associations
    admin_x, admin_y = 15, 8
    for use_case, pos in common_cases:
        ax.plot([admin_x - 0.5, pos[0] + 1.75], [admin_y, pos[1]], 'k-', lw=1)  # Adjusted for narrower ovals
    for use_case, pos in admin_cases:
        ax.plot([admin_x - 0.5, pos[0] + 1.75], [admin_y, pos[1]], 'k-', lw=1)  # Adjusted for narrower ovals
    
    # ===== PROPER UML GENERALIZATION =====
    ax.annotate('', xy=(3.5, 9.5), xytext=(3.5, 6.5),
                arrowprops=dict(arrowstyle='->', lw=2, color='black', linestyle='-'),
                annotation_clip=False)
    
    # Add generalization triangle (hollow)
    triangle = patches.RegularPolygon((3.5, 9.3), 3, radius=0.15, 
                                    orientation=3.14, facecolor='white', 
                                    edgecolor='black', linewidth=2)
    ax.add_patch(triangle)
    
    # Set wider limits for more space
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 14)
    ax.set_aspect('equal')
    ax.axis('off')
    
    plt.title('Use Case Diagram - Real Estate Platform', size=16, weight='bold', pad=20)
    plt.tight_layout()
    plt.savefig('umls/use_case_diagram.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("✅ Use Case Diagram with narrower circles saved to umls/use_case_diagram.png")

if __name__ == "__main__":
    create_proper_use_case_diagram()