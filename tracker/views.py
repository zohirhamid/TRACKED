from django.contrib.auth.decorators import login_required
from datetime import datetime
from calendar import monthrange
from .models import Tracker, Entry
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
import json
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from datetime import datetime, timedelta


# @login_required
def home(request):
    user = User.objects.first()
    if not user:
        user = User.objects.create_user('testuser', password='testpass')
    
    trackers = Tracker.objects.filter(user=user)
    
    month_param = request.GET.get('month')
    if month_param:
        try:
            year, month = map(int, month_param.split('-'))
            current_month = datetime(year, month, 1).date()
        except:
            current_month = datetime.now().date().replace(day=1)
    else:
        current_month = datetime.now().date().replace(day=1)
    
    num_days = monthrange(current_month.year, current_month.month)[1]
    dates = [current_month + timedelta(days=x) for x in range(num_days)]
    
    entries = Entry.objects.filter(
        tracker__user=user,
        date__year=current_month.year,
        date__month=current_month.month
    ).select_related('tracker')
    
    entry_dict = {}
    for entry in entries:
        key = f"{entry.tracker.id}_{entry.date}"
        entry_dict[key] = entry
    
    context = {
        'trackers': trackers,
        'dates': dates,
        'today': datetime.now().date(),
        'current_month': current_month,
        'entries': entry_dict,
    }
    
    return render(request, 'tracker/home.html', context)



# @login_required 
@require_http_methods(["POST"])
def add_tracker(request):
    user = User.objects.first()
    
    name = request.POST.get('tracker_name', '').strip()
    tracker_type = request.POST.get('tracker_type', 'binary')
    unit = request.POST.get('tracker_unit', '').strip()
    
    if not name:
        return JsonResponse({'error': 'Tracker name is required'}, status=400)
    
    Tracker.objects.create(
        user=user,
        name=name,
        tracker_type=tracker_type,
        unit=unit if unit else None
    )
    
    return redirect('home')


# @login_required
@require_http_methods(["POST"])
def update_entry(request):
    user = User.objects.first()
    
    data = json.loads(request.body)
    tracker_id = data.get('tracker_id')
    date_str = data.get('date')
    value = data.get('value')
    
    tracker = get_object_or_404(Tracker, id=tracker_id, user=user)
    date = datetime.strptime(date_str, '%Y-%m-%d').date()
    
    entry, created = Entry.objects.get_or_create(
        tracker=tracker,
        date=date
    )
    
    if tracker.tracker_type == 'binary':
        entry.binary_value = value in [True, 'true', '1', 'yes']
    elif tracker.tracker_type == 'number':
        if value:
            entry.number_value = value
        else:
            entry.number_value = None
    elif tracker.tracker_type == 'time':
        if value:
            entry.time_value = datetime.strptime(value, '%H:%M').time()
    elif tracker.tracker_type == 'duration':
        if value and '-' in value:
            start, end = value.split('-')
            entry.duration_start = datetime.strptime(start.strip(), '%H:%M').time()
            entry.duration_end = datetime.strptime(end.strip(), '%H:%M').time()
    
    entry.save()
    
    return JsonResponse({'success': True})


# @login_required
@require_http_methods(["POST"])
def delete_entry(request):
    user = User.objects.first()
    
    data = json.loads(request.body)
    tracker_id = data.get('tracker_id')
    date_str = data.get('date')
    
    tracker = get_object_or_404(Tracker, id=tracker_id, user=user)
    date = datetime.strptime(date_str, '%Y-%m-%d').date()
    
    Entry.objects.filter(tracker=tracker, date=date).delete()
    
    return JsonResponse({'success': True})