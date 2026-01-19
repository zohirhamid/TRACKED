from django.views.generic import TemplateView, ListView, CreateView, UpdateView, DeleteView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect, get_object_or_404
from django.urls import reverse_lazy
from django.http import JsonResponse
from datetime import datetime, time, date
from decimal import Decimal, InvalidOperation
import calendar
import json
from .models import Tracker, DailySnapshot, Entry

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
        
        trackers = Tracker.objects.filter(
            user=self.request.user, 
            is_active=True
        ).order_by('display_order')
        
        num_days = calendar.monthrange(year, month)[1]
        
        # Build days list grouped by weeks
        weeks = []
        current_week = []
        
        for day in range(1, num_days + 1):
            date_obj = datetime(year, month, day).date()
            
            snapshot, created = DailySnapshot.objects.get_or_create(
                user=self.request.user,
                date=date_obj
            )
            
            entries = Entry.objects.filter(
                daily_snapshot=snapshot,
                tracker__in=trackers
            ).select_related('tracker')
            
            entries_dict = {entry.tracker.id: entry for entry in entries}
            
            day_data = {
                'date': date_obj,
                'entries': entries_dict
            }
            
            current_week.append(day_data)
            
            # If Sunday (weekday 6) or last day of month, close the week
            if date_obj.weekday() == 6 or day == num_days:
                weeks.append(current_week)
                current_week = []
        
        # Calculate week stats
        week_stats = []
        for week_days in weeks:
            stats = {}
            for tracker in trackers:
                if tracker.tracker_type == 'binary':
                    # Count how many days were True
                    count = sum(1 for d in week_days 
                            if d['entries'].get(tracker.id) 
                            and d['entries'][tracker.id].binary_value == True)
                    stats[tracker.id] = f"{count}/{len(week_days)}"
                elif tracker.tracker_type == 'number':
                    # Calculate average
                    values = [d['entries'][tracker.id].number_value 
                            for d in week_days 
                            if d['entries'].get(tracker.id) 
                            and d['entries'][tracker.id].number_value is not None]
                    if values:
                        avg = sum(values) / len(values)
                        stats[tracker.id] = f"{avg:.1f}"
                    else:
                        stats[tracker.id] = "—"
                elif tracker.tracker_type in ['time', 'duration']:
                    # Count tracked days
                    count = sum(1 for d in week_days 
                            if d['entries'].get(tracker.id))
                    stats[tracker.id] = f"{count}/{len(week_days)}"
                else:
                    stats[tracker.id] = "—"
            
            week_stats.append(stats)
        
        # Previous/next month
        if month == 1:
            prev_year, prev_month = year - 1, 12
        else:
            prev_year, prev_month = year, month - 1
            
        if month == 12:
            next_year, next_month = year + 1, 1
        else:
            next_year, next_month = year, month + 1
        
        months = [{'name': calendar.month_abbr[m], 'number': m} for m in range(1, 13)]
        
        context.update({
            'trackers': trackers,
            'weeks': weeks,
            'week_stats': week_stats,
            'year': year,
            'month': month,
            'month_name': calendar.month_name[month],
            'prev_year': prev_year,
            'prev_month': prev_month,
            'next_year': next_year,
            'next_month': next_month,
            'months': months,
            'total_days': num_days,
            'days_with_entries': 0,
            'completion_rate': 0,
            'today': date.today(),
        })
        
        return context


class TrackerListView(LoginRequiredMixin, ListView):
    """Shows all user's trackers in a list/table format"""
    model = Tracker
    template_name = 'tracker/tracker_list.html'
    context_object_name = 'trackers'
    
    def get_queryset(self):
        return super().get_queryset().filter(
            user=self.request.user
        ).order_by('-is_active', 'display_order', 'name')


class TrackerCreateView(LoginRequiredMixin, CreateView):
    """Form to create a new tracker"""
    model = Tracker
    template_name = 'tracker/tracker_form.html'
    fields = ['name', 'tracker_type', 'unit', 'display_order', 'is_active']
    success_url = reverse_lazy('tracker:tracker_list')
    
    def form_valid(self, form):
        form.instance.user = self.request.user
        return super().form_valid(form)


class TrackerUpdateView(LoginRequiredMixin, UpdateView):
    """Form to edit an existing tracker"""
    model = Tracker
    template_name = 'tracker/tracker_form.html'
    fields = ['name', 'tracker_type', 'unit', 'display_order', 'is_active']
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
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON'})
        
        tracker_id = data.get('tracker_id')
        date_str = data.get('date')
        delete_entry = data.get('delete_entry', False)
        
        try:
            tracker = Tracker.objects.get(id=tracker_id, user=request.user)
        except Tracker.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid tracker'})
        
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse({'success': False, 'error': 'Invalid date format'})
        
        snapshot, created = DailySnapshot.objects.get_or_create(
            user=request.user,
            date=date_obj
        )
        
        if delete_entry:
            Entry.objects.filter(tracker=tracker, daily_snapshot=snapshot).delete()
            return JsonResponse({'success': True, 'deleted': True})
        
        entry, created = Entry.objects.get_or_create(
            tracker=tracker,
            daily_snapshot=snapshot
        )
        
        # Set values based on tracker type
        if tracker.tracker_type == 'binary':
            entry.binary_value = data.get('binary_value')
        elif tracker.tracker_type == 'number':
            entry.number_value = Decimal(str(data.get('number_value')))
        elif tracker.tracker_type == 'time':
            entry.time_value = datetime.strptime(data.get('time_value'), '%H:%M').time()
        elif tracker.tracker_type == 'duration':
            duration_minutes = data.get('duration_minutes')
            if duration_minutes is not None:
                entry.duration_minutes = int(duration_minutes)
            else:
                entry.duration_minutes = None

        entry.save()
        return JsonResponse({'success': True, 'entry_id': entry.id})


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