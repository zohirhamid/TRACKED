from django.views.decorators.csrf import ensure_csrf_cookie

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_view(request):
    return Response({"detail": "CSRF cookie set."}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def public_config_view(request):
    return Response(
        {
            "google_client_id": getattr(settings, "GOOGLE_CLIENT_ID", None) or "",
        },
        status=status.HTTP_200_OK,
    )
