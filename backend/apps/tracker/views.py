from django.shortcuts import get_object_or_404
from datetime import datetime, date
import calendar
from .models import Tracker, DailySnapshot, Entry
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializers import ProfileSerializer, TrackerSerializer, EntrySerializer, DailySnapshotSerializer
from .constants import SUGGESTED_TRACKERS, get_suggested_trackers_list
from .services import TrackerStatsService, MonthDataBuilder
from .utils import get_month_navigation
from .permissions import CanCreateTracker


class MonthView(APIView):
    """The main Excel-like grid view API for a specific month"""
    permission_classes = [IsAuthenticated]

    def get(self, request, year, month):
        trackers = self.get_trackers(request.user)
        
        # Use the MonthDataBuilder service
        month_builder = MonthDataBuilder(request.user, year, month)
        weeks = month_builder.build_weeks(trackers)
        
        # Serialize trackers
        tracker_serializer = TrackerSerializer(trackers, many=True)
        
        data = {
            'trackers': tracker_serializer.data,
            'weeks': weeks,
            'week_stats': TrackerStatsService.calculate_week_stats(weeks, trackers),
            'month_name': calendar.month_name[month],
            'months': [{'name': calendar.month_abbr[m], 'number': m} for m in range(1, 13)],
            'total_days': calendar.monthrange(year, month)[1],
            'today': date.today().isoformat(),
            **get_month_navigation(year, month),
        }

        return Response(data, status=status.HTTP_200_OK)

    def get_trackers(self, user):
        return Tracker.objects.filter(
            user=user, 
            is_active=True
        ).order_by('display_order')
    

class TrackerListView(APIView):
    """Returns all user's trackers in a list format"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        trackers = Tracker.objects.filter(
            user=request.user
        ).order_by('-is_active', 'display_order', 'name')
        
        serializer = TrackerSerializer(trackers, many=True)
        
        response_data = {
            'trackers': serializer.data
        }
        
        # Only show suggestions if user has no trackers
        if not trackers.exists():
            response_data['suggested_trackers'] = get_suggested_trackers_list()
        
        return Response(response_data, status=status.HTTP_200_OK)


class QuickAddTrackerView(APIView):
    """Quickly add a suggested tracker"""
    permission_classes = [IsAuthenticated, CanCreateTracker]
    
    
    
    def post(self, request, slug):
        if slug not in SUGGESTED_TRACKERS:
            return Response(
                {'success': False, 'error': 'Invalid tracker'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        tracker_data = SUGGESTED_TRACKERS[slug]
        
        # Check if user already has this tracker
        if Tracker.objects.filter(user=request.user, name=tracker_data['name']).exists():
            return Response(
                {'success': False, 'error': 'Tracker already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get next display order
        max_order = Tracker.objects.filter(user=request.user).aggregate(
            max_order=models.Max('display_order')
        )['max_order'] or 0
        
        # Create tracker
        tracker = Tracker.objects.create(
            user=request.user,
            display_order=max_order + 1,
            **tracker_data
        )
        
        return Response({
            'success': True,
            'tracker_id': tracker.id,
            'tracker_name': tracker.name
        }, status=status.HTTP_201_CREATED)
    
    
class TrackerCreateView(APIView):
    """API endpoint to create a new tracker"""
    permission_classes = [IsAuthenticated, CanCreateTracker]

    def post(self, request):
        serializer = TrackerSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class TrackerUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        tracker = get_object_or_404(Tracker, id=pk)

        if tracker.user != request.user:
            return Response(
                {'success': False, 'error': 'Unauthorized'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = TrackerSerializer(tracker, data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class TrackerDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        tracker = get_object_or_404(Tracker, id=pk, user=request.user)
        tracker.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class EntryCreateUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        
        # Validate tracker
        tracker, error = self.get_tracker(data.get('tracker_id'), request.user)
        if error:
            return error
        
        # Validate date
        date_obj, error = self.parse_date(data.get('date'))
        if error:
            return error
        
        # Get or create snapshot
        snapshot = self.get_or_create_snapshot(request.user, date_obj)
        
        # Handle delete
        if data.get('delete_entry', False):
            return self.delete_entry(tracker, snapshot)
        
        # Create/update entry
        return self.save_entry(tracker, snapshot, data)
    
    def get_tracker(self, tracker_id, user):
        try:
            return Tracker.objects.get(id=tracker_id, user=user), None
        except Tracker.DoesNotExist:
            return None, Response(
                {'success': False, 'error': 'Invalid tracker'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def parse_date(self, date_str):
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date(), None
        except (ValueError, TypeError):
            return None, Response(
                {'success': False, 'error': 'Invalid date format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
    def get_or_create_snapshot(self, user, date_obj):
        snapshot, _ = DailySnapshot.objects.get_or_create(user=user, date=date_obj)
        return snapshot

    def delete_entry(self, tracker, snapshot):
        Entry.objects.filter(tracker=tracker, daily_snapshot=snapshot).delete()
        return Response({'success': True, 'deleted': True}, status=status.HTTP_200_OK)

    def save_entry(self, tracker, snapshot, data):
        entry, _ = Entry.objects.get_or_create(tracker=tracker, daily_snapshot=snapshot)
        
        entry.clear_values()
        
        try:
            entry.set_value_from_data(data)
            entry.save()
            return Response({'success': True, 'entry_id': entry.id}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class EntryDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        entry = get_object_or_404(Entry, id=pk)
    
        if entry.tracker.user != request.user:
            return Response(
                {'success': False, 'error': 'Unauthorized'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        entry.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)