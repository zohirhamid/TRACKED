from datetime import date, timedelta
from rest_framework.exceptions import ValidationError
from apps.tracker.models import DailySnapshot, Entry

def get_report_type(value):
    if value not in {"daily", "weekly", "monthly"}:
        raise ValidationError({"report_type": "report_type must be daily, weekly, or monthly."})
    return value

def get_period(report_type):
    today = date.today()
    if report_type == "daily":
        return today - timedelta(days=1), today
    if report_type == "weekly":
        return today - timedelta(days=7), today
    return today - timedelta(days=30), today

def get_entry_value(entry):
    t = entry.tracker.tracker_type
    if t == "binary":
        return entry.binary_value
    if t == "number":
        return float(entry.number_value) if entry.number_value else None
    if t == "rating":
        return entry.rating_value
    if t == "duration":
        return entry.duration_minutes
    if t == "time":
        return entry.time_value.isoformat() if entry.time_value else None
    if t == "text":
        return entry.text_value
    return None

def get_tracking_data(user, period_start, period_end, trackers):
    snapshots = DailySnapshot.objects.filter(user=user, date__range=(period_start, period_end))
    data = {}

    for snapshot in snapshots:
        day_key = snapshot.date.isoformat()
        day_entries = {}

        entries = (Entry.objects
            .filter(daily_snapshot=snapshot, tracker__in=trackers)
            .select_related("tracker")
        )

        for entry in entries:
            value = get_entry_value(entry)
            if value is not None:
                day_entries[entry.tracker.name] = value

        if day_entries:
            data[day_key] = day_entries

    return data
