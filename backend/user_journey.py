import matplotlib.pyplot as plt
import matplotlib.patches as patches

def create_user_journey():
    fig, ax = plt.subplots(1, 1, figsize=(16, 6))
    
    # User journey steps
    steps = [
        "Visit Website", "Register/Login", "Browse Properties", 
        "Filter Search", "View Property Details", "Save to Wishlist",
        "Contact Seller", "Schedule Visit", "Make Offer", "Complete Purchase"
    ]
    
    # Draw flowchart
    y_pos = 5
    for i, step in enumerate(steps):
        # Create rectangle for each step
        rect = patches.Rectangle((i*1.8, y_pos), 1.6, 0.6, 
                               linewidth=2, edgecolor='navy', 
                               facecolor='lightblue', alpha=0.8)
        ax.add_patch(rect)
        ax.text(i*1.8 + 0.8, y_pos + 0.3, step, 
               ha='center', va='center', fontsize=8, weight='bold')
        
        # Draw arrows between steps
        if i < len(steps) - 1:
            ax.arrow(i*1.8 + 1.6, y_pos + 0.3, 0.2, 0, 
                    head_width=0.1, head_length=0.1, fc='black', ec='black')
    
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 7)
    ax.set_aspect('equal')
    ax.axis('off')
    plt.title('Real Estate Platform - User Journey Diagram', size=14, weight='bold', pad=20)
    plt.tight_layout()
    plt.savefig('umls/user_journey.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("✅ User journey diagram saved to umls/user_journey.png")

if __name__ == "__main__":
    create_user_journey()