from rest_framework import serializers
from .models import Insight


class InsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insight
        fields = [
            'id',
            'report_type',
            'period_start',
            'period_end',
            'content',
            'generated_at',
        ]
        read_only_fields = fields