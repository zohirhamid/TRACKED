from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from datetime import date, timedelta
from .models import Insight
from .serializers import InsightSerializer


class LatestInsightView(APIView):
    """Get the most recent insight of a given type"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, report_type):
        if report_type not in ['daily', 'weekly', 'monthly']:
            return Response(
                {'error': 'Invalid report type'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        insight = Insight.objects.filter(
            owner=request.user,
            report_type=report_type
        ).first()
        
        if not insight:
            return Response({'content': None, 'message': 'No insight yet'})
        
        serializer = InsightSerializer(insight)
        return Response(serializer.data)


class InsightHistoryView(APIView):
    """Get all insights of a given type for progress tracking"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, report_type):
        if report_type not in ['daily', 'weekly', 'monthly']:
            return Response(
                {'error': 'Invalid report type'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        limit = int(request.query_params.get('limit', 30))
        
        insights = Insight.objects.filter(
            owner=request.user,
            report_type=report_type
        )[:limit]
        
        serializer = InsightSerializer(insights, many=True)
        return Response({
            'report_type': report_type,
            'insights': serializer.data
        })


class GenerateInsightView(APIView):
    """Generate a new insight by calling AI"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, report_type):
        if report_type not in ['daily', 'weekly', 'monthly']:
            return Response(
                {'error': 'Invalid report type'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        period_start, period_end = self.get_period_dates(report_type)
        tracking_data = self.get_tracking_data(request.user, period_start, period_end)
        content = self.generate_ai_content(tracking_data, report_type, period_start, period_end)
        
        insight = Insight.objects.create(
            owner=request.user,
            report_type=report_type,
            period_start=period_start,
            period_end=period_end,
            content=content
        )
        
        serializer = InsightSerializer(insight)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def generate_ai_content(self, tracking_data, report_type, period_start, period_end):
        from .services import generate_insight_content
        return generate_insight_content(tracking_data, report_type, period_start, period_end)
    
    def get_period_dates(self, report_type):
        today = date.today()
        
        if report_type == 'daily':
            return today, today
        
        elif report_type == 'weekly':
            start = today - timedelta(days=today.weekday())
            end = start + timedelta(days=6)
            return start, end
        
        elif report_type == 'monthly':
            start = today.replace(day=1)
            next_month = today.replace(day=28) + timedelta(days=4)
            end = next_month - timedelta(days=next_month.day)
            return start, end
        
        return today, today
    
    def get_tracking_data(self, user, period_start, period_end):
        # FIXED: Changed import path from 'tracker.models' to 'apps.tracker.models'
        from apps.tracker.models import Tracker, DailySnapshot, Entry
        
        trackers = Tracker.objects.filter(user=user, is_active=True)
        
        snapshots = DailySnapshot.objects.filter(
            user=user,
            date__gte=period_start,
            date__lte=period_end
        )
        
        data = {}
        
        for snapshot in snapshots:
            day_key = snapshot.date.isoformat()
            data[day_key] = {}
            
            entries = Entry.objects.filter(
                daily_snapshot=snapshot,
                tracker__in=trackers
            ).select_related('tracker')
            
            for entry in entries:
                tracker_name = entry.tracker.name
                value = self.get_entry_value(entry)
                if value is not None:
                    data[day_key][tracker_name] = value
        
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