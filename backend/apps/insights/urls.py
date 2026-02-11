# insights/urls.py

from django.urls import path
from .views import (
    LatestInsightView,
    InsightHistoryView,
    GenerateInsightView,
    GenerateInsightStatusView,
)

app_name = 'insights'

urlpatterns = [
    path('latest/', LatestInsightView.as_view(), name='latest'),
    path('history/', InsightHistoryView.as_view(), name='history'),
    path('generate/', GenerateInsightView.as_view(), name='generate'),
    path('generate/status/<str:task_id>/', GenerateInsightStatusView.as_view(), name='generate-status'),
]
