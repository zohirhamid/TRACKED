# insights/urls.py

from django.urls import path
from .views import LatestInsightView, InsightHistoryView, GenerateInsightView

app_name = 'insights'

urlpatterns = [
    path('latest/<str:report_type>/', LatestInsightView.as_view(), name='latest'),
    path('history/<str:report_type>/', InsightHistoryView.as_view(), name='history'),
    path('generate/<str:report_type>/', GenerateInsightView.as_view(), name='generate'),
]