from django.shortcuts import redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from apps.payments.models import Subscription


class LandingPageView(TemplateView):
    template_name = 'landing_page.html'
    
    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('tracker:home')
        return super().get(request, *args, **kwargs)


class SettingsView(LoginRequiredMixin, TemplateView):
    template_name = 'core/settings.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        try:
            subscription = Subscription.objects.get(user=self.request.user)
            context['is_pro'] = subscription.is_active
        except Subscription.DoesNotExist:
            context['is_pro'] = False
        
        return context