from django.db import models
from django.conf import settings


class Insight(models.Model):
    REPORT_TYPES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    id:int
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    report_type = models.CharField(max_length=10, choices=REPORT_TYPES)
    period_start = models.DateField()
    period_end = models.DateField()
    content = models.JSONField()
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-generated_at'] 

    def __str__(self):
        return f"{self.owner.email} - {self.report_type} - {self.period_start}"