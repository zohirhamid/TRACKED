from datetime import datetime, date
import calendar
from .models import Tracker, DailySnapshot, Entry
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import TrackerSerializer, EntrySerializer
from .services import MonthDataBuilder
from .utils import get_month_navigation
from .permissions import CanCreateTracker, IsOwner, IsEntryOwner
from rest_framework import generics, status
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
        existing_entry = Entry.objects.filter(tracker=tracker, daily_snapshot=snapshot).first()
 
        # Handle delete request
        if data.get('delete_entry'):
            if existing_entry:
                existing_entry.delete()
            return Response({'success': True}, status=status.HTTP_200_OK)
 
        if existing_entry:
            # Update existing entry
            existing_entry.clear_values()
            try:
                existing_entry.set_value_from_data(data)
                existing_entry.save()
                return Response(
                    {'success': True, 'entry_id': existing_entry.id},
                    status=status.HTTP_200_OK
                )
            except ValueError as e:
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
            
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

class TrackerDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwner]
    queryset = Tracker.objects.all()
    serializer_class = TrackerSerializer

class EntryDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsEntryOwner]
    queryset = Entry.objects.all()
    serializer_class = EntrySerializer
