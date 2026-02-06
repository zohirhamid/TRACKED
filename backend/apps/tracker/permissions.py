# tracker/permissions.py
from rest_framework import permissions
# from subscriptions.models import Subscription  # Uncomment when you implement subscriptions


class CanCreateTracker(permissions.BasePermission):
    """
    Permission to check if user can create more trackers.
    Currently allows unlimited trackers, but can be configured
    to enforce limits based on subscription tier.
    """
    
    message = "Tracker limit reached. Please upgrade to Pro for unlimited trackers."
    
    def has_permission(self, request, view):
        """
        Check if the user can create a new tracker.
        
        Returns:
            bool: True if user can create tracker, False otherwise
        """
        # Uncomment when implementing subscription limits:
        # FREE_LIMIT = 3
        # tracker_count = request.user.tracker_set.filter(is_active=True).count()
        # 
        # if tracker_count >= FREE_LIMIT:
        #     return Subscription.is_user_pro(request.user)
        
        return True  # Unlimited for now