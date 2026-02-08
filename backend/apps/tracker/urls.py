# tracker/urls.py
from django.urls import path
from .views import (
    MonthView,
    QuickAddTrackerView,
    TrackerListView,
    TrackerCreateView,
    TrackerUpdateView,
    TrackerDeleteView,
    EntryCreateView,
    EntryUpdateView,
    EntryDeleteView,
)

app_name = 'tracker'

urlpatterns = [
    # Month view
    path('month/<int:year>/<int:month>/', MonthView.as_view(), name='month_view'),
    
    # Tracker CRUD
    path('trackers/', TrackerListView.as_view(), name='tracker_list'),  # GET (list)
    path('trackers/create/', TrackerCreateView.as_view(), name='tracker_create'),  # POST (create)
    path('trackers/quick-add/<slug:slug>/', QuickAddTrackerView.as_view(), name='quick_add_tracker'),  # POST
    path('trackers/<int:pk>/', TrackerUpdateView.as_view(), name='tracker_update'),  # PUT/PATCH
    path('trackers/<int:pk>/delete/', TrackerDeleteView.as_view(), name='tracker_delete'),  # DELETE
    
    # Entry CRUD
    path('entries/create/', EntryCreateView.as_view(), name='entry_create'),
    path('entries/<int:pk>/', EntryUpdateView.as_view(), name='entry_update'),
    path('entries/<int:pk>/', EntryDeleteView.as_view(), name='entry_delete'),  # DELETE
]