# tracker/forms.py
from django import forms
from .models import Tracker


class TrackerForm(forms.ModelForm):
    class Meta:
        model = Tracker
        fields = [
            'name', 
            'tracker_type', 
            'unit', 
            'display_order', 
            'is_active',
            'min_value', 
            'max_value'
        ]
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'e.g., Sleep, Mood, Workout'
            }),
            'tracker_type': forms.Select(attrs={
                'class': 'form-select'
            }),
            'unit': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'e.g., hours, L, calories'
            }),
            'display_order': forms.NumberInput(attrs={
                'class': 'form-input'
            }),
            'min_value': forms.NumberInput(attrs={
                'class': 'form-input',
                'placeholder': '1'
            }),
            'max_value': forms.NumberInput(attrs={
                'class': 'form-input',
                'placeholder': '5 or 10'
            }),
        }
        help_texts = {
            'name': 'What do you want to track?',
            'tracker_type': 'How will you track this?',
            'unit': 'e.g., hours, L, calories, /5',
            'display_order': 'Lower numbers appear first in your grid',
            'min_value': 'For Rating type: minimum value',
            'max_value': 'For Rating type: maximum value',
        }