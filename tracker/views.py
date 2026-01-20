from django.views.generic import TemplateView, ListView, CreateView, UpdateView, DeleteView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect, get_object_or_404
from django.urls import reverse_lazy
from django.http import JsonResponse
from datetime import datetime, time, date
from decimal import Decimal
import calendar
import json
from .models import Tracker, DailySnapshot, Entry
from .forms import TrackerForm
from django.db import models

class HomePageView(LoginRequiredMixin, TemplateView):
    """Landing page - redirects to current month's tracking view"""
    template_name = 'tracker/home.html'
    
    def get(self, request):
        today = datetime.now()
        return redirect('tracker:month_view', year=today.year, month=today.month)

class MonthView(LoginRequiredMixin, TemplateView):
    """The main Excel-like grid view for a specific month"""
    template_name = 'tracker/month_view.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        year = self.kwargs.get('year')
        month = self.kwargs.get('month')
        
        trackers = self.get_trackers()
        
        weeks = self.build_weeks(year, month, trackers)
        
        context.update({
            'trackers': trackers,
            'weeks': weeks,
            'week_stats': self.calculate_week_stats(weeks, trackers),
            'month_name': calendar.month_name[month],
            'months': [{'name': calendar.month_abbr[m], 'number': m} for m in range(1, 13)],
            'total_days': calendar.monthrange(year, month)[1],
            'today': date.today(),
            **self.get_navigation(year, month),
        })
        
        return context

    def get_trackers(self):
        return Tracker.objects.filter(
            user=self.request.user, 
            is_active=True
        ).order_by('display_order')
    
    def build_weeks(self, year, month, trackers):
        weeks = []
        current_week = []
        num_days = calendar.monthrange(year, month)[1]
        
        for day in range(1, num_days + 1):
            date_obj = datetime(year, month, day).date()
            day_data = self.build_day_data(date_obj, trackers)
            current_week.append(day_data)
            
            if date_obj.weekday() == 6 or day == num_days:
                weeks.append(current_week)
                current_week = []
        
        return weeks

    def build_day_data(self, date_obj, trackers):
        snapshot, created = DailySnapshot.objects.get_or_create(
            user=self.request.user,
            date=date_obj
        )
        
        entries = Entry.objects.filter(
            daily_snapshot=snapshot,
            tracker__in=trackers
        ).select_related('tracker')
        
        return {
            'date': date_obj,
            'entries': {entry.tracker.id: entry for entry in entries}
        }

    def calculate_week_stats(self, weeks, trackers):
        week_stats = []
        
        for week_days in weeks:
            stats = {}
            for tracker in trackers:
                stats[tracker.id] = self.calculate_tracker_stat(tracker, week_days)
            week_stats.append(stats)
        
        return week_stats
    
    def calculate_tracker_stat(self, tracker, week_days):
        if tracker.tracker_type == 'binary':
            count = sum(1 for d in week_days 
                        if d['entries'].get(tracker.id) 
                        and d['entries'][tracker.id].binary_value == True)
            return f"{count}/{len(week_days)}"
        
        elif tracker.tracker_type in ['number', 'rating']:
            value_field = 'number_value' if tracker.tracker_type == 'number' else 'rating_value'
            values = [getattr(d['entries'][tracker.id], value_field)
                    for d in week_days 
                    if d['entries'].get(tracker.id) 
                    and getattr(d['entries'][tracker.id], value_field) is not None]
            if values:
                return f"{sum(values) / len(values):.1f}"
            return "—"
        
        elif tracker.tracker_type in ['time', 'duration']:
            count = sum(1 for d in week_days if d['entries'].get(tracker.id))
            return f"{count}/{len(week_days)}"
        
        elif tracker.tracker_type == 'text':
            count = sum(1 for d in week_days 
                        if d['entries'].get(tracker.id) 
                        and d['entries'][tracker.id].text_value)
            return f"{count}/{len(week_days)}"
        
        return "—"

    def get_navigation(self, year, month):
        if month == 1:
            prev_year, prev_month = year - 1, 12
        else:
            prev_year, prev_month = year, month - 1
            
        if month == 12:
            next_year, next_month = year + 1, 1
        else:
            next_year, next_month = year, month + 1
        
        return {
            'prev_year': prev_year,
            'prev_month': prev_month,
            'next_year': next_year,
            'next_month': next_month,
        }


class TrackerListView(LoginRequiredMixin, ListView):
    """Shows all user's trackers in a list/table format"""
    model = Tracker
    template_name = 'tracker/tracker_list.html'
    context_object_name = 'trackers'
    
    def get_queryset(self):
        return super().get_queryset().filter(
            user=self.request.user
        ).order_by('-is_active', 'display_order', 'name')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Only show suggestions if user has no trackers
        if not self.get_queryset().exists():
            context['suggested_trackers'] = self.get_suggested_trackers()
        
        return context

    def get_suggested_trackers(self):
        return [
            {'name': 'Sleep', 'tracker_type': 'duration', 'icon': '😴', 'unit': 'hours'},
            {'name': 'Water', 'tracker_type': 'number', 'icon': '💧', 'unit': 'glasses'},
            {'name': 'Exercise', 'tracker_type': 'binary', 'icon': '🏃'},
            {'name': 'Mood', 'tracker_type': 'rating', 'icon': '😊', 'min_value': 1, 'max_value': 5},
            {'name': 'Read', 'tracker_type': 'binary', 'icon': '📚'},
            {'name': 'Meditate', 'tracker_type': 'binary', 'icon': '🧘'},
            {'name': 'Wake Up', 'tracker_type': 'time', 'icon': '⏰'},
            {'name': 'Notes', 'tracker_type': 'text', 'icon': '📝'},
        ]

class QuickAddTrackerView(LoginRequiredMixin, View):
    """Quickly add a suggested tracker"""
    
    SUGGESTED_TRACKERS = {
        'sleep': {'name': 'Sleep', 'tracker_type': 'duration', 'unit': 'hours'},
        'water': {'name': 'Water', 'tracker_type': 'number', 'unit': 'glasses'},
        'exercise': {'name': 'Exercise', 'tracker_type': 'binary'},
        'mood': {'name': 'Mood', 'tracker_type': 'rating', 'min_value': 1, 'max_value': 5},
        'read': {'name': 'Read', 'tracker_type': 'binary'},
        'meditate': {'name': 'Meditate', 'tracker_type': 'binary'},
        'wakeup': {'name': 'Wake Up', 'tracker_type': 'time'},
        'notes': {'name': 'Notes', 'tracker_type': 'text'},
    }
    
    def post(self, request, slug):
        if slug not in self.SUGGESTED_TRACKERS:
            return JsonResponse({'success': False, 'error': 'Invalid tracker'})
        
        tracker_data = self.SUGGESTED_TRACKERS[slug]
        
        # Check if user already has this tracker
        if Tracker.objects.filter(user=request.user, name=tracker_data['name']).exists():
            return JsonResponse({'success': False, 'error': 'Tracker already exists'})
        
        # Get next display order
        max_order = Tracker.objects.filter(user=request.user).aggregate(
            max_order=models.Max('display_order')
        )['max_order'] or 0
        
        # Create tracker
        Tracker.objects.create(
            user=request.user,
            display_order=max_order + 1,
            **tracker_data
        )
        
        return JsonResponse({'success': True})

class TrackerCreateView(LoginRequiredMixin, CreateView):
    """Form to create a new tracker"""
    model = Tracker
    template_name = 'tracker/tracker_form.html'
    form_class = TrackerForm
    success_url = reverse_lazy('tracker:tracker_list')
    
    def form_valid(self, form):
        form.instance.user = self.request.user
        return super().form_valid(form)


class TrackerUpdateView(LoginRequiredMixin, UpdateView):
    """Form to edit an existing tracker"""
    model = Tracker
    template_name = 'tracker/tracker_form.html'
    form_class = TrackerForm
    success_url = reverse_lazy('tracker:tracker_list')
    
    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)


class TrackerDeleteView(LoginRequiredMixin, DeleteView):
    """Confirmation page and deletion of a tracker"""
    model = Tracker
    template_name = 'tracker/tracker_confirm_delete.html'
    success_url = reverse_lazy('tracker:tracker_list')
    
    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)


class EntryCreateUpdateView(LoginRequiredMixin, View):
    """
    Handles saving entry data when user edits a cell in the grid.
    Receives AJAX POST request and creates/updates Entry.
    
    Expected POST data:
    {
        "tracker_id": 5,
        "date": "2025-07-15",
        "value": 4.5 (or true/false, or "23:00", etc.)
    }
    """
    def post(self, request):
        # Parse JSON
        data, error = self.parse_json(request)
        if error:
            return error
        
        if data is None: 
            return JsonResponse({'success': False, 'error': 'Invalid JSON'})
        
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

    def parse_json(self, request):
        try:
            return json.loads(request.body), None
        except json.JSONDecodeError:
            return None, JsonResponse({'success': False, 'error': 'Invalid JSON'})
    
    def get_tracker(self, tracker_id, user):
        try:
            return Tracker.objects.get(id=tracker_id, user=user), None
        except Tracker.DoesNotExist:
            return None, JsonResponse({'success': False, 'error': 'Invalid tracker'})
    
    def parse_date(self, date_str):
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date(), None
        except ValueError:
            return None, JsonResponse({'success': False, 'error': 'Invalid date format'})
        
    def get_or_create_snapshot(self, user, date_obj):
        snapshot, _ = DailySnapshot.objects.get_or_create(user=user, date=date_obj)
        return snapshot

    def delete_entry(self, tracker, snapshot):
        Entry.objects.filter(tracker=tracker, daily_snapshot=snapshot).delete()
        return JsonResponse({'success': True, 'deleted': True})

    def save_entry(self, tracker, snapshot, data):
        entry, _ = Entry.objects.get_or_create(tracker=tracker, daily_snapshot=snapshot)
        
        self.clear_entry_values(entry)
        
        error = self.set_entry_value(entry, tracker, data)
        if error:
            return error
        
        entry.save()
        return JsonResponse({'success': True, 'entry_id': entry.id})

    def clear_entry_values(self, entry):
        entry.binary_value = None
        entry.number_value = None
        entry.time_value = None
        entry.duration_minutes = None
        entry.text_value = None
        entry.rating_value = None

    def set_entry_value(self, entry, tracker, data):
        if tracker.tracker_type == 'binary':
            entry.binary_value = data.get('binary_value')
        
        elif tracker.tracker_type == 'number':
            entry.number_value = Decimal(str(data.get('number_value')))
        
        elif tracker.tracker_type == 'time':
            entry.time_value = datetime.strptime(data.get('time_value'), '%H:%M').time()
        
        elif tracker.tracker_type == 'duration':
            duration = data.get('duration_minutes')
            entry.duration_minutes = int(duration) if duration is not None else None
        
        elif tracker.tracker_type == 'text':
            entry.text_value = data.get('text_value', '')
        
        elif tracker.tracker_type == 'rating':
            return self.set_rating_value(entry, tracker, data)
        
        return None

    def set_rating_value(self, entry, tracker, data):
        rating_val = data.get('rating_value')
        if rating_val is None:
            return None
        
        rating_int = int(rating_val)
        
        if tracker.min_value and rating_int < tracker.min_value:
            return JsonResponse({
                'success': False,
                'error': f'Rating must be at least {tracker.min_value}'
            })
        
        if tracker.max_value and rating_int > tracker.max_value:
            return JsonResponse({
                'success': False,
                'error': f'Rating must be at most {tracker.max_value}'
            })
        
        entry.rating_value = rating_int
        return None
        

class EntryDeleteView(LoginRequiredMixin, View):
    """Deletes a specific entry (clears a cell)"""
    
    def post(self, request, pk):
        try:
            entry = Entry.objects.get(pk=pk)
        except Entry.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Entry not found'})
        
        # Verify entry belongs to current user
        if entry.tracker.user != request.user:
            return JsonResponse({'success': False, 'error': 'Unauthorized'})
        
        entry.delete()
        
        return JsonResponse({'success': True})