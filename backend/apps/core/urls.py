from django.urls import path
from .views import LandingPageView, SettingsView

app_name = 'core'

urlpatterns = [
    path('', LandingPageView.as_view(), name='landing'),
    path('settings/', SettingsView.as_view(), name='settings'),
]