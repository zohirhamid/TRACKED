from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Profile(models.Model):
    """
    Extra information about the user that django's user model doesn't have.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar_url = models.URLField(blank=True)
    google_id = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"Profile: {self.user.email}"


class Tracker(models.Model):
    """
    Defines WHAT the user wants to track.
    replaces the column header in Excel sheet.
    """
    id:int
    TYPE_CHOICES = [
        ('binary', 'Yes/No (Binary)'),
        ('number', 'Number'),
        ('time', 'Time'),
        ('duration', 'Duration (Start/End Time)'),
        ('text', 'Text/Notes'),
        ('rating', 'Rating/Scale'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    tracker_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    unit = models.CharField(max_length=20, blank=True, null=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Rating-specific fields
    min_value = models.IntegerField(null=True, blank=True, help_text="Minimum rating value (e.g., 1)")
    max_value = models.IntegerField(null=True, blank=True, help_text="Maximum rating value (e.g., 5 or 10)")
    
    class Meta:
        ordering = ['display_order', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.user.email})"


class DailySnapshot(models.Model):
    """
    Represents ONE DAY for ONE USER. (a row in excel)
    its a container that groups all entries for a certain day.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    overall_notes = models.TextField(blank=True)
    is_complete = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.user.email} - {self.date}"


class Entry(models.Model):
    """
    The ACTUAL DATA. This is the value in a cell of your Excel sheet.
    """
    id:int
    tracker = models.ForeignKey(Tracker, on_delete=models.CASCADE)
    daily_snapshot = models.ForeignKey(DailySnapshot, on_delete=models.CASCADE)
    binary_value = models.BooleanField(null=True, blank=True)
    number_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    time_value = models.TimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True, help_text="Duration in minutes")
    
    text_value = models.TextField(null=True, blank=True, help_text="For text/notes tracker")
    rating_value = models.IntegerField(null=True, blank=True, help_text="For rating tracker")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['tracker', 'daily_snapshot']
        indexes = [
            models.Index(fields=['daily_snapshot', 'tracker']),
        ]
    
    def __str__(self):
        return f"{self.tracker.name} - {self.daily_snapshot.date}"

    def get_duration_display(self):
        """Format duration as '4h 30min' or '5h' or '45min'"""
        if self.duration_minutes is None:
            return ""

        hours = self.duration_minutes // 60
        minutes = self.duration_minutes % 60
        
        if hours > 0 and minutes > 0:
            return f"{hours}h {minutes}min"
        elif hours > 0:
            return f"{hours}h"
        else:
            return f"{minutes}min"
    
    def get_rating_display(self):
        """Format rating with context from tracker
        Ratings may come from trackers with or without a defined scale.
        When a scale exists, we show the rating in context (e.g. 4/5) so
        users can immediately understand its meaning. If no scale is
        defined, we fall back to displaying the raw value.
        """
        if self.rating_value is None:
            return ""
        
        if self.tracker.min_value and self.tracker.max_value:
            return f"{self.rating_value}/{self.tracker.max_value}"
        return str(self.rating_value)