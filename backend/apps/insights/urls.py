# insights/urls.py

from django.urls import path
from .views import LatestInsightView, InsightHistoryView, GenerateInsightView

app_name = 'insights'

urlpatterns = [
    path('latest/', LatestInsightView.as_view(), name='latest'),
    path('history/', InsightHistoryView.as_view(), name='history'),
    path('generate/', GenerateInsightView.as_view(), name='generate'),
]