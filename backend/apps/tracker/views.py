from django.shortcuts import get_object_or_404
from datetime import datetime, date
import calendar
from .models import Tracker, DailySnapshot, Entry
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import ProfileSerializer, TrackerSerializer, EntrySerializer, DailySnapshotSerializer
from .constants import SUGGESTED_TRACKERS, get_suggested_trackers_list
from .services import TrackerStatsService, MonthDataBuilder
from .utils import get_month_navigation
from .permissions import CanCreateTracker, IsOwner, IsEntryOwner
from rest_framework import generics, status
from typing import Any
from django.db.models import QuerySet


class MonthView(generics.GenericAPIView):
    """The main Excel-like grid view API for a specific month"""
    permission_classes = [IsAuthenticated]
    serializer_class = TrackerSerializer
    
    def get(self, request, year, month):
        trackers = self.get_trackers(request.user)
        
        # Use the MonthDataBuilder service
        month_builder = MonthDataBuilder(request.user, year, month)
        weeks = month_builder.build_weeks(trackers)
        
        # Serialize trackers
        tracker_serializer = self.get_serializer(trackers, many=True)
        
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

class TrackerListView(generics.ListAPIView):
    """Returns all user's trackers in a list format"""
    permission_classes = [IsAuthenticated, IsOwner]
    serializer_class = TrackerSerializer

    def get_queryset(self) -> QuerySet[Tracker]: # type: ignore[override]
        return Tracker.objects.filter(user=self.request.user).order_by('-is_active', 'display_order', 'name')
    
    def list(self, request, *args, **kwargs):
        """
        Override list to always include suggested trackers.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'trackers': serializer.data,
            'suggested_trackers': get_suggested_trackers_list()
        }

        return Response(response_data, status=status.HTTP_200_OK)
        
class TrackerCreateView(generics.CreateAPIView):
    serializer_class = TrackerSerializer
    permission_classes = [IsAuthenticated, CanCreateTracker]

    # sets the owner at creation time
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TrackerUpdateView(generics.UpdateAPIView):
    queryset = Tracker.objects.all()
    serializer_class = TrackerSerializer
    permission_classes = [IsAuthenticated, IsOwner]

class EntryCreateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EntrySerializer

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
        
        # Check if entry already exists
        if Entry.objects.filter(tracker=tracker, daily_snapshot=snapshot).exists():
            return Response(
                {'success': False, 'error': 'Entry already exists. Use update endpoint.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create entry
        return self.create_entry(tracker, snapshot, data)
    
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
    
    def create_entry(self, tracker, snapshot, data):
        entry = Entry.objects.create(tracker=tracker, daily_snapshot=snapshot)
        
        try:
            entry.set_value_from_data(data)
            entry.save()
            return Response(
                {'success': True, 'entry_id': entry.id}, 
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            entry.delete()  # Clean up if validation fails
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class EntryUpdateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsEntryOwner]
    serializer_class = EntrySerializer

    def patch(self, request, pk):
        # Get entry and verify ownership
        try:
            entry = Entry.objects.get(
                id=pk, 
                tracker__user=request.user
            )
        except Entry.DoesNotExist:
            return Response(
                {'success': False, 'error': 'Entry not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update entry
        entry.clear_values()
        
        try:
            entry.set_value_from_data(request.data)
            entry.save()
            return Response(
                {'success': True, 'entry_id': entry.id}, 
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class TrackerDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwner]
    queryset = Tracker.objects.all()
    serializer_class = TrackerSerializer

class EntryDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsEntryOwner]
    queryset = Entry.objects.all()
    serializer_class = EntrySerializer

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