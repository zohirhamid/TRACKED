from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date, timedelta
from django.db.models import QuerySet
from django.utils.timezone import now
from apps.tracker.models import Tracker, DailySnapshot, Entry
from .models import Insight
from .serializers import InsightSerializer

# Cooldown between generations (in hours)
GENERATE_COOLDOWN = timedelta(hours=1)

class LatestInsightView(generics.GenericAPIView):
    """Get the most recent insight of a given type"""
    permission_classes = [IsAuthenticated]
    serializer_class = InsightSerializer
    
    def get(self, request):
        insight = Insight.objects.filter(owner=request.user).first()
        
        if not insight:
            return Response({'content': None, 'message': 'No insight yet'})
        
        serializer = self.get_serializer(insight)
        return Response(serializer.data)


class InsightHistoryView(generics.ListAPIView):
    """Get all insights of a given type for progress tracking"""
    permission_classes = [IsAuthenticated]
    serializer_class = InsightSerializer
    queryset = Insight.objects.none()
    
    def get_queryset(self) -> QuerySet[Insight]:  # type: ignore[override]
        limit = int(self.request.GET.get('limit', 10))
        return Insight.objects.filter(owner=self.request.user)[:limit]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({'insights': serializer.data})

class GenerateInsightView(generics.GenericAPIView):
    """Generate a new AI insight from the user's tracking data"""
    permission_classes = [IsAuthenticated]
    serializer_class = InsightSerializer

    def post(self, request):
        # Determine the analysis period - last 30 days
        today = date.today()
        period_start = today - timedelta(days=30)
        period_end = today
        
        # Collect tracking data
        tracking_data = self.get_tracking_data(request.user, period_start, period_end)
        
        # Don't waste an API call if there's no data
        if not tracking_data:
            return Response(
                {'error': 'No tracking data found. Start logging some entries first!'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rate limit: check cooldown since last insight
        last_insight = Insight.objects.filter(owner=request.user).first()
        
        if last_insight:
            time_since = now() - last_insight.generated_at
            if time_since < GENERATE_COOLDOWN:
                remaining = GENERATE_COOLDOWN - time_since
                minutes_left = int(remaining.total_seconds() // 60)
                return Response(
                    {'error': f'Please wait {minutes_left} more minutes before generating a new insight.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
        
        # Fetch trackers for AI context
        trackers = Tracker.objects.filter(user=request.user, is_active=True)
        
        # Generate insight
        content = self.generate_ai_content(tracking_data, period_start, period_end, trackers)
        
        # Adjust period_start to the earliest day with actual data
        actual_start = min(tracking_data.keys())
        
        insight = Insight.objects.create(
            owner=request.user,
            report_type='analysis',
            period_start=actual_start,
            period_end=period_end,
            content=content
        )
        
        serializer = self.get_serializer(insight)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def generate_ai_content(self, tracking_data, period_start, period_end, trackers):
        from .services import generate_insight_content
        return generate_insight_content(tracking_data, 'analysis', period_start, period_end, trackers)
    
    def get_tracking_data(self, user, period_start, period_end):
        trackers = Tracker.objects.filter(user=user, is_active=True)
        
        snapshots = DailySnapshot.objects.filter(
            user=user,
            date__gte=period_start,
            date__lte=period_end
        )
        
        data = {}
        
        for snapshot in snapshots:
            day_key = snapshot.date.isoformat()
            day_entries = {}
            
            entries = Entry.objects.filter(
                daily_snapshot=snapshot,
                tracker__in=trackers
            ).select_related('tracker')
            
            for entry in entries:
                tracker_name = entry.tracker.name
                value = self.get_entry_value(entry)
                if value is not None:
                    day_entries[tracker_name] = value
            
            # Only include days that actually have entries
            if day_entries:
                data[day_key] = day_entries
        
        return data

    def get_entry_value(self, entry):
        tracker_type = entry.tracker.tracker_type
        
        if tracker_type == 'binary':
            return entry.binary_value
        elif tracker_type == 'number':
            return float(entry.number_value) if entry.number_value else None
        elif tracker_type == 'rating':
            return entry.rating_value
        elif tracker_type == 'duration':
            return entry.duration_minutes
        elif tracker_type == 'time':
            return entry.time_value.isoformat() if entry.time_value else None
        elif tracker_type == 'text':
            return entry.text_value
        
        return None
