from django.db import models
from django.contrib.auth.models import User


class Tracker(models.Model):
    id: int
    
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
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class Entry(models.Model):
    id: int
    
    tracker = models.ForeignKey(Tracker, on_delete=models.CASCADE)
    date = models.DateField()
    
    # 
    binary_value = models.BooleanField(null=True, blank=True)
    number_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    time_value = models.TimeField(null=True, blank=True)
    duration_start = models.TimeField(null=True, blank=True)
    duration_end = models.TimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['tracker', 'date']
    
    def __str__(self):
        return f"{self.tracker.name} - {self.date}"