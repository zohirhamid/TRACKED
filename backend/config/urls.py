from django.contrib import admin
from django.urls import path, include

from .views import csrf_view

urlpatterns = [
    path("admin/", admin.site.urls),

    # API v1
    path("api/v1/auth/csrf/", csrf_view, name="csrf"),
    path("api/v1/_allauth/", include("allauth.headless.urls")),
    path("api/v1/insights/", include("apps.insights.urls")),
    path("api/v1/tracker/", include("apps.tracker.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
]
