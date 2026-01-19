from django.shortcuts import redirect
from django.views.generic import TemplateView


class LandingPageView(TemplateView):
    template_name = 'landing_page.html'
    
    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('tracker:home')
        return super().get(request, *args, **kwargs)