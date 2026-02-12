# insights/urls.py

from django.urls import path
from .views import InsightListView, GenerateInsightView

app_name = 'insights'

urlpatterns = [
    path('', InsightListView.as_view(), name='list'),
    path('generate/', GenerateInsightView.as_view(), name='generate'),
]
