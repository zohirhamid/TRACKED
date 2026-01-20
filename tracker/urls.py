from django.urls import path
from .views import (
    HomePageView,
    MonthView,
    QuickAddTrackerView,
    TrackerListView,
    TrackerCreateView,
    TrackerUpdateView,
    TrackerDeleteView,
    EntryCreateUpdateView,
    EntryDeleteView,
)

app_name = 'tracker'

urlpatterns = [
    # Main dashboard - shows current month
    path('', HomePageView.as_view(), name='home'),
    
    # Month view - Excel-like grid for specific month
    path('<int:year>/<int:month>/', MonthView.as_view(), name='month_view'),
    
    # Tracker management
    path('trackers/', TrackerListView.as_view(), name='tracker_list'),
    path('trackers/create/', TrackerCreateView.as_view(), name='tracker_create'),
    path('trackers/<int:pk>/edit/', TrackerUpdateView.as_view(), name='tracker_update'),
    path('trackers/<int:pk>/delete/', TrackerDeleteView.as_view(), name='tracker_delete'),
    
    # Entry management (for creating/editing cell data)
    path('entry/save/', EntryCreateUpdateView.as_view(), name='entry_save'),
    path('entry/<int:pk>/delete/', EntryDeleteView.as_view(), name='entry_delete'),

    path('trackers/quick-add/<slug:slug>/', QuickAddTrackerView.as_view(), name='quick_add_tracker'),

]