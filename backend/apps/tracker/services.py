# tracker/services.py
from datetime import datetime
import calendar
from .models import DailySnapshot, Entry
from .serializers import EntrySerializer

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
        snapshot, _ = DailySnapshot.objects.get_or_create(
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