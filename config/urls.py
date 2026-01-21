from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
    path('tracker/', include('tracker.urls')),

    path('accounts/', include('allauth.urls')),
    path('payments/', include('payments.urls')),
]