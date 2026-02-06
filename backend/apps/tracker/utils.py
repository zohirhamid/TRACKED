# tracker/utils.py

def get_month_navigation(year, month):
    """
    Get previous and next month/year for calendar navigation.
    
    Args:
        year (int): Current year
        month (int): Current month (1-12)
    
    Returns:
        dict: Dictionary with prev_year, prev_month, next_year, next_month
    """
    if month == 1:
        prev_year, prev_month = year - 1, 12
    else:
        prev_year, prev_month = year, month - 1
        
    if month == 12:
        next_year, next_month = year + 1, 1
    else:
        next_year, next_month = year, month + 1
    
    return {
        'prev_year': prev_year,
        'prev_month': prev_month,
        'next_year': next_year,
        'next_month': next_month,
    }