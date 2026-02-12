from django.db.models import QuerySet
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.tracker.models import Tracker
from .models import Insight
from .serializers import InsightSerializer
from .utils import get_report_type, get_period, get_tracking_data
from .services import generate_insight_content


class InsightListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = InsightSerializer
    queryset = Insight.objects.none()

    def get_queryset(self) -> QuerySet[Insight]:  # type: ignore[override]
        report_type = get_report_type(self.request.GET.get("report_type"))
        limit = int(self.request.GET.get("limit", 20))
        return (Insight.objects
            .filter(owner=self.request.user, report_type=report_type)
            .order_by("-period_end")[:limit]
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        return Response({"insights": self.get_serializer(qs, many=True).data})


class GenerateInsightView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = InsightSerializer

    def post(self, request):
        report_type = get_report_type(request.data.get("report_type"))
        period_start, period_end = get_period(report_type)

        trackers = Tracker.objects.filter(user=request.user, is_active=True)
        tracking_data = get_tracking_data(request.user, period_start, period_end, trackers)

        if not tracking_data:
            return Response(
                {"error": "No tracking data found. Start logging some entries first!"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content = generate_insight_content(tracking_data, report_type, period_start, period_end, trackers)

        insight, created = Insight.objects.update_or_create(
            owner=request.user,
            report_type=report_type,
            period_start=period_start,
            period_end=period_end,
            defaults={"content": content},
        )

        return Response(
            self.get_serializer(insight).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
