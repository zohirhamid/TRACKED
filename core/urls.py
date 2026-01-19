from django.urls import path
from .views import LandingPageView

app_name = 'core'

urlpatterns = [
    path('', LandingPageView.as_view(), name='landing'),
    
    # TODO: Add these pages later:
    # path('about/', AboutView.as_view(), name='about'),
    # path('pricing/', PricingView.as_view(), name='pricing'),
    # path('features/', FeaturesView.as_view(), name='features'),
    # path('contact/', ContactView.as_view(), name='contact'),
    # path('terms/', TermsView.as_view(), name='terms'),
    # path('privacy/', PrivacyView.as_view(), name='privacy'),
    # path('faq/', FAQView.as_view(), name='faq'),
]