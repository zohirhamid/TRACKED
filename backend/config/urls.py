from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # JWT Auth
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    # API v1
    path("api/v1/insights/", include("apps.insights.urls")),
    path("api/v1/tracker/", include("apps.tracker.urls")),
    path("api/v1/core/", include("apps.core.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
]