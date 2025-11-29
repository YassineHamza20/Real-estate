import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch

def draw_human_figure(ax, x, y, label, color='#2E86AB'):
    """Draw a more detailed human figure"""
    # Head
    head = patches.Circle((x, y), 0.4, facecolor=color, alpha=0.8, edgecolor='black', linewidth=1)
    ax.add_patch(head)
    
    # Body (torso)
    body = patches.Rectangle((x-0.3, y-0.4), 0.6, 0.8, facecolor=color, alpha=0.6, edgecolor='black', linewidth=1)
    ax.add_patch(body)
    
    # Arms
    ax.plot([x-0.3, x-0.8], [y-0.1, y-0.3], 'k-', lw=3, color='#333333')
    ax.plot([x+0.3, x+0.8], [y-0.1, y-0.3], 'k-', lw=3, color='#333333')
    
    # Legs
    ax.plot([x-0.15, x-0.4], [y-0.4, y-1.2], 'k-', lw=3, color='#333333')
    ax.plot([x+0.15, x+0.4], [y-0.4, y-1.2], 'k-', lw=3, color='#333333')
    
    # Label
    ax.text(x, y-1.6, label, fontsize=11, weight='bold', ha='center', 
            bbox=dict(boxstyle="round,pad=0.4", facecolor="lightyellow", edgecolor="gold"))

def create_enhanced_use_case_diagram():
    fig, ax = plt.subplots(1, 1, figsize=(20, 14))  # Increased size
    
    # System boundary with fancy box
    system_box = FancyBboxPatch((2.5, 1), 15, 12, boxstyle="round,pad=0.5",  # Wider boundary
                               linewidth=3, edgecolor='#D32F2F', facecolor='#FFEBEE', alpha=0.3)
    ax.add_patch(system_box)
    ax.text(10, 13.2, 'Real Estate Management System', fontsize=20, weight='bold', 
           ha='center', va='center', color='#D32F2F')
    
    # Draw human figures for actors
    draw_human_figure(ax, 1, 9, 'Property Buyer', '#4CAF50')
    draw_human_figure(ax, 1, 4, 'Property Seller', '#FF9800') 
    draw_human_figure(ax, 19, 7, 'System Admin', '#F44336')
    
    # Use cases with DIFFERENT positions for each actor - NO OVERLAPPING
    buyer_use_cases = [
        ("Register/Login", (6, 11.5)),
        ("Search Properties", (6, 10.5)),
        ("Filter Results", (6, 9.5)),
        ("View Details", (6, 8.5)),
        ("Save to Wishlist", (6, 7.5)),
        ("Contact Seller", (6, 6.5))
    ]
    
    seller_use_cases = [
        ("Seller Registration", (10, 11.5)),
        ("List Property", (10, 10.5)),
        ("Upload Photos", (10, 9.5)),
        ("Manage Listings", (10, 8.5)),
        ("Respond to Messages", (10, 7.5))
    ]
    
    admin_use_cases = [
        ("Manage All Users", (14, 11.5)),
        ("System Statistics", (14, 10.5)),
        ("Manage All Properties", (14, 9.5)),
        ("Verify Sellers", (14, 8.5)),
        ("Generate Reports", (14, 7.5)),
        ("Edit Any Content", (14, 6.5)),
        ("Delete Any Data", (14, 5.5)),
        ("Full System Control", (14, 4.5))
    ]
    
    # Draw use cases with different colors
    for use_case, pos in buyer_use_cases:
        oval = patches.Ellipse(pos, 5, 0.9, linewidth=2, edgecolor='#4CAF50', 
                             facecolor='#E8F5E8', alpha=0.9)
        ax.add_patch(oval)
        ax.text(pos[0], pos[1], use_case, fontsize=10, ha='center', va='center', 
               weight='bold', color='#2E7D32')
    
    for use_case, pos in seller_use_cases:
        oval = patches.Ellipse(pos, 5, 0.9, linewidth=2, edgecolor='#FF9800', 
                             facecolor='#FFF3E0', alpha=0.9)
        ax.add_patch(oval)
        ax.text(pos[0], pos[1], use_case, fontsize=10, ha='center', va='center', 
               weight='bold', color='#EF6C00')
    
    for use_case, pos in admin_use_cases:
        oval = patches.Ellipse(pos, 5, 0.9, linewidth=2, edgecolor='#F44336', 
                             facecolor='#FFEBEE', alpha=0.9)
        ax.add_patch(oval)
        ax.text(pos[0], pos[1], use_case, fontsize=10, ha='center', va='center', 
               weight='bold', color='#C62828')
    
    # Draw association lines
    # Buyer associations
    for use_case, pos in buyer_use_cases:
        ax.plot([1.8, pos[0]-2.5], [9, pos[1]], 'k-', lw=1.5, alpha=0.6, color='#4CAF50')
    
    # Seller associations  
    for use_case, pos in seller_use_cases:
        ax.plot([1.8, pos[0]-2.5], [4, pos[1]], 'k-', lw=1.5, alpha=0.6, color='#FF9800')
    
    # Admin associations
    for use_case, pos in admin_use_cases:
        ax.plot([18.2, pos[0]+2.5], [7, pos[1]], 'k-', lw=1.5, alpha=0.6, color='#F44336')
    
    ax.set_xlim(0, 20)
    ax.set_ylim(0, 14)
    ax.set_aspect('equal')
    ax.axis('off')
    
    # Add legend
    legend_elements = [
        patches.Patch(facecolor='#E8F5E8', edgecolor='#4CAF50', label='Buyer Use Cases'),
        patches.Patch(facecolor='#FFF3E0', edgecolor='#FF9800', label='Seller Use Cases'),
        patches.Patch(facecolor='#FFEBEE', edgecolor='#F44336', label='Admin Use Cases')
    ]
    ax.legend(handles=legend_elements, loc='upper center', bbox_to_anchor=(0.5, 0.02), 
             ncol=3, frameon=True, fancybox=True, shadow=True)
    
    plt.title('COMPREHENSIVE USE CASE DIAGRAM\nReal Estate Platform', 
             size=22, weight='bold', pad=30, color='#2E386B')
    plt.tight_layout()
    plt.savefig('umls/enhanced_use_case_diagram.png', dpi=300, bbox_inches='tight', 
               facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Fixed Enhanced Use Case Diagram saved to umls/enhanced_use_case_diagram.png")

if __name__ == "__main__":
    create_enhanced_use_case_diagram()