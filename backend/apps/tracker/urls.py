from django.urls import path
from .views import (
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
    
    path('api/month/<int:year>/<int:month>/', MonthView.as_view(), name='month_view'),
    
    
    path('api/trackers/', TrackerListView.as_view(), name='tracker_list'),  # GET
    path('api/trackers/', TrackerCreateView.as_view(), name='tracker_create'),  # POST
    path('api/trackers/<int:pk>/', TrackerUpdateView.as_view(), name='tracker_detail'),  # PUT/PATCH
    path('api/trackers/<int:pk>/', TrackerDeleteView.as_view(), name='tracker_delete'),  # DELETE
    
    
    path('api/entries/', EntryCreateUpdateView.as_view(), name='entry_save'),  # POST
    path('api/entries/<int:pk>/', EntryDeleteView.as_view(), name='entry_delete'),  # DELETE
    
   
    path('api/trackers/quick-add/<slug:slug>/', QuickAddTrackerView.as_view(), name='quick_add_tracker'),  # POST
]