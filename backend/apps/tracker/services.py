# tracker/services.py
from datetime import datetime
from .models import DailySnapshot, Entry
from .serializers import EntrySerializer

class TrackerStatsService:

    @staticmethod
    def calculate_week_stats(weeks, trackers):
        """Calculate statistics for each tracker across all weeks"""
        week_stats = []
        
        for week_days in weeks:
            stats = {}
            for tracker in trackers:
                stats[tracker.id] = TrackerStatsService.calculate_tracker_stat(tracker, week_days)
            week_stats.append(stats)
        
        return week_stats
    
    @staticmethod
    def calculate_tracker_stat(tracker, week_days):
        """Calculate a single tracker's statistic for one week"""
        if tracker.tracker_type == 'binary':
            count = sum(1 for d in week_days 
                        if d['entries'].get(tracker.id) 
                        and d['entries'][tracker.id].get('binary_value') == True)
            return f"{count}/{len(week_days)}"
        
        elif tracker.tracker_type in ['number', 'rating']:
            value_field = 'number_value' if tracker.tracker_type == 'number' else 'rating_value'
            values = []
            for d in week_days:
                if d['entries'].get(tracker.id):
                    val = d['entries'][tracker.id].get(value_field)
                    if val is not None:
                        # Convert to float to handle both int and string values
                        try:
                            values.append(float(val))
                        except (ValueError, TypeError):
                            pass
            
            if values:
                return f"{sum(values) / len(values):.1f}"
            return "—"
        
        elif tracker.tracker_type in ['time', 'duration']:
            count = sum(1 for d in week_days if d['entries'].get(tracker.id))
            return f"{count}/{len(week_days)}"
        
        elif tracker.tracker_type == 'text':
            count = sum(1 for d in week_days 
                        if d['entries'].get(tracker.id) 
                        and d['entries'][tracker.id].get('text_value'))
            return f"{count}/{len(week_days)}"
        
        return "—"
    
class MonthDataBuilder:
    """Service for building month view data structure"""
    
    def __init__(self, user, year, month):
        self.user = user
        self.year = year
        self.month = month
    
    def build_weeks(self, trackers):
        """
        Build week structure for the month with entries.
        
        Returns:
            list: List of weeks, where each week is a list of day data
        """
        import calendar
        
        weeks = []
        current_week = []
        num_days = calendar.monthrange(self.year, self.month)[1]
        
        for day in range(1, num_days + 1):
            date_obj = datetime(self.year, self.month, day).date()
            day_data = self._build_day_data(date_obj, trackers)
            current_week.append(day_data)
            
            if date_obj.weekday() == 6 or day == num_days:
                weeks.append(current_week)
                current_week = []
        
        return weeks
    
    def _build_day_data(self, date_obj, trackers):
        """
        Build data for a single day including all entries.
        
        Args:
            date_obj: Date object for the day
            trackers: QuerySet of trackers to include
        
        Returns:
            dict: Day data with date and entries
        """
        snapshot, created = DailySnapshot.objects.get_or_create(
            user=self.user,
            date=date_obj
        )
        
        entries = Entry.objects.filter(
            daily_snapshot=snapshot,
            tracker__in=trackers
        ).select_related('tracker')
        
        # Serialize entries
        entries_dict = {}
        for entry in entries:
            entries_dict[entry.tracker.id] = EntrySerializer(entry).data
        
        return {
            'date': date_obj.isoformat(),
            'day': date_obj.day,
            'entries': entries_dict
        }