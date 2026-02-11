from datetime import date, timedelta

from celery import shared_task

from apps.tracker.models import DailySnapshot, Entry, Tracker

from .models import Insight
from .services import generate_insight_content


def _get_entry_value(entry):
    tracker_type = entry.tracker.tracker_type

    if tracker_type == "binary":
        return entry.binary_value
    if tracker_type == "number":
        return float(entry.number_value) if entry.number_value else None
    if tracker_type == "rating":
        return entry.rating_value
    if tracker_type == "duration":
        return entry.duration_minutes
    if tracker_type == "time":
        return entry.time_value.isoformat() if entry.time_value else None
    if tracker_type == "text":
        return entry.text_value

    return None


def _get_tracking_data(user, period_start, period_end):
    trackers = Tracker.objects.filter(user=user, is_active=True)
    snapshots = DailySnapshot.objects.filter(
        user=user,
        date__gte=period_start,
        date__lte=period_end,
    )

    data = {}

    for snapshot in snapshots:
        entries = Entry.objects.filter(
            daily_snapshot=snapshot,
            tracker__in=trackers,
        ).select_related("tracker")

        day_entries = {}
        for entry in entries:
            value = _get_entry_value(entry)
            if value is not None:
                day_entries[entry.tracker.name] = value

        if day_entries:
            data[snapshot.date.isoformat()] = day_entries

    return data


@shared_task(bind=True)
def generate_insight_task(self, user_id, report_type="analysis"):
    from django.contrib.auth import get_user_model

    user_model = get_user_model()
    user = user_model.objects.get(id=user_id)

    period_end = date.today()
    period_start = period_end - timedelta(days=30)
    trackers = Tracker.objects.filter(user=user, is_active=True)
    tracking_data = _get_tracking_data(user, period_start, period_end)

    if not tracking_data:
        raise ValueError("No tracking data found.")

    content = generate_insight_content(
        tracking_data=tracking_data,
        report_type=report_type,
        period_start=period_start,
        period_end=period_end,
        trackers=trackers,
    )

    actual_start = date.fromisoformat(min(tracking_data.keys()))
    insight = Insight.objects.create(
        owner=user,
        report_type=report_type,
        period_start=actual_start,
        period_end=period_end,
        content=content,
    )

    return {
        "insight_id": insight.id,
    }
