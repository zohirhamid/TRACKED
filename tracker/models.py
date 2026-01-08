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
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    tracker_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    unit = models.CharField(max_length=20, blank=True, null=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
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
    duration_start = models.TimeField(null=True, blank=True)
    duration_end = models.TimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['tracker', 'daily_snapshot']
        indexes = [
            models.Index(fields=['daily_snapshot', 'tracker']),
        ]
    
    def __str__(self):
        return f"{self.tracker.name} - {self.daily_snapshot.date}"