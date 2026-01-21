# payments/views.py
from django.http import HttpResponse
import stripe
from django.conf import settings
from django.shortcuts import redirect
from django.views import View
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth import get_user_model
from .models import Subscription
from stripe import SignatureVerificationError

User = get_user_model()
stripe.api_key = settings.STRIPE_SECRET_KEY

class UpgradeView(LoginRequiredMixin, TemplateView):
    template_name = 'payments/upgrade.html'
    
    def get(self, request, *args, **kwargs):
        # If already Pro, redirect to settings
        try:
            subscription = Subscription.objects.get(user=request.user)
            if subscription.is_active:
                return redirect('core:settings')
        except Subscription.DoesNotExist:
            pass
        
        return super().get(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['stripe_price_monthly'] = settings.STRIPE_PRICE_PRO_MONTHLY
        context['stripe_price_yearly'] = settings.STRIPE_PRICE_PRO_YEARLY
        return context

class CreateCheckoutSessionView(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        price_id = request.POST.get('priceId')
        
        session = stripe.checkout.Session.create(
            customer_email=request.user.email,
            success_url=request.build_absolute_uri('/payments/success/') + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.build_absolute_uri('/payments/upgrade/'),
            mode='subscription',
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            metadata={
                'user_id': request.user.id,
            },
        )
        
        if not session.url:
            raise ValueError("Stripe didn't return a checkout URL")
    
        return redirect(session.url, code=303)

class SuccessView(TemplateView):
    template_name = 'payments/success.html'

class CancelView(TemplateView):
    template_name = 'payments/cancel.html'

@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(View):
    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        webhook_secret = settings.STRIPE_WEBHOOK_SECRET

        # Verify signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError:
            return HttpResponse(status=400)
        except SignatureVerificationError:
            return HttpResponse(status=400)

        event_type = event['type']

        if event_type == 'checkout.session.completed':
            session = event['data']['object']
            self.handle_checkout_completed(session)

        elif event_type == 'invoice.paid':
            invoice = event['data']['object']
            print(f"Invoice paid: {invoice['id']}")

        elif event_type == 'invoice.payment_failed':
            invoice = event['data']['object']
            self.handle_payment_failed(invoice)

        else:
            print(f"Unhandled event: {event_type}")

        return HttpResponse(status=200)

    def handle_checkout_completed(self, session):
        user_id = session.get('metadata', {}).get('user_id')
        stripe_customer_id = session.get('customer')
        stripe_subscription_id = session.get('subscription')

        if not user_id:
            print("No user_id in metadata")
            return

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            print(f"User {user_id} not found")
            return

        # Create or update subscription
        subscription, created = Subscription.objects.update_or_create(
            user=user,
            defaults={
                'stripe_customer_id': stripe_customer_id,
                'stripe_subscription_id': stripe_subscription_id,
                'is_active': True,
            }
        )

        print(f"{'Created' if created else 'Updated'} subscription for {user.email}")

    def handle_payment_failed(self, invoice):
        stripe_customer_id = invoice.get('customer')
        
        try:
            subscription = Subscription.objects.get(stripe_customer_id=stripe_customer_id)
            subscription.is_active = False
            subscription.save()
            print(f"Deactivated subscription for {subscription.user.email}")
        except Subscription.DoesNotExist:
            print(f"No subscription found for customer {stripe_customer_id}")

class BillingPortalView(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        try:
            subscription = Subscription.objects.get(user=request.user)
        except Subscription.DoesNotExist:
            return redirect('payments:upgrade')

        if not subscription.stripe_customer_id:
            return redirect('payments:upgrade')

        session = stripe.billing_portal.Session.create(
            customer=subscription.stripe_customer_id,
            return_url=request.build_absolute_uri('/settings/'),
        )

        return redirect(session.url, code=303)