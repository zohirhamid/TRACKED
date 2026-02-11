from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from datetime import date, timedelta
from django.utils.timezone import now
from celery.result import AsyncResult
from apps.tracker.models import Tracker, DailySnapshot, Entry
from .models import Insight
from .serializers import InsightSerializer
from .tasks import generate_insight_task

# Cooldown between generations (in hours)
GENERATE_COOLDOWN = timedelta(hours=0)

class LatestInsightView(APIView):
    """Get the most recent insight of a given type"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        insight = Insight.objects.filter(owner=request.user).first()
        
        if not insight:
            return Response({'content': None, 'message': 'No insight yet'})
        
        serializer = InsightSerializer(insight)
        return Response(serializer.data)


class InsightHistoryView(APIView):
    """Get all insights of a given type for progress tracking"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        
        insights = Insight.objects.filter(owner=request.user)[:limit]
        
        serializer = InsightSerializer(insights, many=True)
        return Response({'insights': serializer.data})

class GenerateInsightView(APIView):
    """Queue a new AI insight generation job"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        today = date.today()
        period_start = today - timedelta(days=30)
        period_end = today
        
        tracking_data = self.get_tracking_data(request.user, period_start, period_end)
        
        if not tracking_data:
            return Response(
                {'error': 'No tracking data found. Start logging some entries first!'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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
        
        task = generate_insight_task.delay(request.user.id, 'analysis') # type: ignore
        return Response(
            {'task_id': task.id, 'status': 'queued'},
            status=status.HTTP_202_ACCEPTED
        )

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


class GenerateInsightStatusView(APIView):
    """Get status of an insight generation task."""
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        result = AsyncResult(task_id)
        state = result.state

        if state in {'PENDING', 'RECEIVED', 'STARTED', 'RETRY'}:
            return Response({'status': 'pending'})

        if state == 'FAILURE':
            error_message = str(result.result) if result.result else 'Insight generation failed.'
            return Response(
                {'status': 'failed', 'error': error_message},
            )

        if state == 'SUCCESS':
            task_result = result.result or {}
            insight_id = task_result.get('insight_id')
            if not insight_id:
                return Response(
                    {'status': 'failed', 'error': 'Insight generation failed.'},
                )

            insight = Insight.objects.filter(id=insight_id, owner=request.user).first()
            if not insight:
                return Response(
                    {'status': 'failed', 'error': 'Insight not found for this user.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = InsightSerializer(insight)
            return Response({'status': 'success', 'insight': serializer.data})

        return Response({'status': 'pending'})
