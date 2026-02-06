# payments/urls.py
from django.urls import path
from .views import (
    UpgradeView,
    CreateCheckoutSessionView,
    SuccessView,
    CancelView,
    StripeWebhookView,
    BillingPortalView,
)

app_name = "payments"

urlpatterns = [
    path('upgrade/', UpgradeView.as_view(), name='upgrade'),
    path('create-checkout-session/', CreateCheckoutSessionView.as_view(), name='create-checkout-session'),
    path('success/', SuccessView.as_view(), name='success'),
    path('cancel/', CancelView.as_view(), name='cancel'),
    path('webhook/', StripeWebhookView.as_view(), name='webhook'),
    path('billing/', BillingPortalView.as_view(), name='billing'),
]