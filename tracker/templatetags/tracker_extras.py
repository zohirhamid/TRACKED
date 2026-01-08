from django import template

register = template.Library()

@register.filter
def get_item(container, key):
    """
    Get item from dictionary by key or list by index.
    Usage: {{ dictionary|get_item:key }} or {{ list|get_item:index }}
    """
    if container is None:
        return None
    
    # If it's a dict, use .get()
    if isinstance(container, dict):
        return container.get(key)
    
    # If it's a list, use index
    if isinstance(container, list):
        try:
            return container[int(key)]
        except (ValueError, IndexError, TypeError):
            return None
    
    return None