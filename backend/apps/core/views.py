from django.shortcuts import redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from apps.payments.models import Subscription

User = get_user_model()
 
 
@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()
    email = request.data.get('email', '').strip()
 
    if not username or not password:
        return Response(
            {'detail': 'Username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
 
    if User.objects.filter(username=username).exists():
        return Response(
            {'detail': 'A user with that username already exists.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
 
    if email and User.objects.filter(email=email).exists():
        return Response(
            {'detail': 'A user with that email already exists.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
 
    user = User.objects.create_user(username=username, password=password, email=email)
    refresh = RefreshToken.for_user(user)
 
    return Response(
        {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def user_count_view(request):
    count = User.objects.filter(is_active=True).count()
    return Response({'count': count}, status=status.HTTP_200_OK)

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
