# tracker/cache.py

from django.core.cache import cache

MONTH_VIEW_TIMEOUT = 300  # 5 minutes


def get_month_cache_key(user_id, year, month):
    """Generate a cache key for a user's month view."""
    return f'month_view_{user_id}_{year}_{month}'


def get_cached_month_view(user_id, year, month):
    """Get cached month view data, returns None if not cached."""
    key = get_month_cache_key(user_id, year, month)
    return cache.get(key)


def set_month_view_cache(user_id, year, month, data):
    """Cache month view data."""
    key = get_month_cache_key(user_id, year, month)
    cache.set(key, data, MONTH_VIEW_TIMEOUT)


def invalidate_month_cache(user_id, year, month):
    """Clear cached month view when data changes."""
    key = get_month_cache_key(user_id, year, month)
    cache.delete(key)