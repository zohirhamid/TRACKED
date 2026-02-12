from django.db import models
from django.conf import settings


class Insight(models.Model):
    REPORT_TYPES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    
    period_start = models.DateField()
    period_end = models.DateField()
    content = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(period_end__gte=models.F('period_start')),
                name='insight_period_end_gte_start',
            ),
        ]

    def __str__(self):
        return f"{self.owner.get_username()} - {self.report_type} - {self.period_start}"
