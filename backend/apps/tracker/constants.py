# tracker/constants.py

SUGGESTED_TRACKERS = {
        # Health & Wellness
        'sleep': {'name': 'Sleep', 'tracker_type': 'duration', 'unit': 'hours'},
        'wakeup': {'name': 'Wake Up', 'tracker_type': 'time'},
        'mood': {'name': 'Mood', 'tracker_type': 'rating', 'min_value': 1, 'max_value': 5},
        'water': {'name': 'Water', 'tracker_type': 'number', 'unit': 'glasses'},
        'weight': {'name': 'Weight', 'tracker_type': 'number', 'unit': 'kg'},
        'calories': {'name': 'Calories', 'tracker_type': 'number', 'unit': 'kcal'},
        'steps': {'name': 'Steps', 'tracker_type': 'number', 'unit': 'steps'},
        
        # Fitness
        'exercise': {'name': 'Exercise', 'tracker_type': 'binary'},
        'gym': {'name': 'Gym', 'tracker_type': 'binary'},
        'stretching': {'name': 'Stretching', 'tracker_type': 'binary'},
        'running': {'name': 'Running', 'tracker_type': 'duration', 'unit': 'mins'},
        
        # Mindfulness & Personal
        'meditate': {'name': 'Meditate', 'tracker_type': 'binary'},
        'journal': {'name': 'Journal', 'tracker_type': 'binary'},
        'gratitude': {'name': 'Gratitude', 'tracker_type': 'binary'},
        'prayer': {'name': 'Prayer', 'tracker_type': 'binary'},
        
        # Productivity
        'read': {'name': 'Read', 'tracker_type': 'binary'},
        'study': {'name': 'Study', 'tracker_type': 'duration', 'unit': 'mins'},
        'work': {'name': 'Work', 'tracker_type': 'duration', 'unit': 'hours'},
        'sideproject': {'name': 'Side Project', 'tracker_type': 'binary'},
        'learning': {'name': 'Learning', 'tracker_type': 'binary'},
        
        # Habits to Break
        'noalcohol': {'name': 'No Alcohol', 'tracker_type': 'binary'},
        'nosmoking': {'name': 'No Smoking', 'tracker_type': 'binary'},
        'nosocialmedia': {'name': 'No Social Media', 'tracker_type': 'binary'},
        
        # Self-care
        'skincare': {'name': 'Skincare', 'tracker_type': 'binary'},
        'coldshower': {'name': 'Cold Shower', 'tracker_type': 'binary'},
        'vitamins': {'name': 'Vitamins', 'tracker_type': 'binary'},
        
        # Other
        'notes': {'name': 'Notes', 'tracker_type': 'text'},
        'spending': {'name': 'Spending', 'tracker_type': 'number', 'unit': '£'},
        'callfamily': {'name': 'Call Family', 'tracker_type': 'binary'},
        'cooking': {'name': 'Cooking', 'tracker_type': 'binary'},
    }


def get_suggested_trackers_list():
    return [
        {**data, 'slug': slug} 
        for slug, data in SUGGESTED_TRACKERS.items()
    ]