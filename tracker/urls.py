from django.urls import path
from . import views

# Remove app_name to use simple URL names
urlpatterns = [
    path('', views.home, name='home'),
    path('tracker/add/', views.add_tracker, name='add_tracker'),
    path('entry/update/', views.update_entry, name='update_entry'),
    path('entry/delete/', views.delete_entry, name='delete_entry'),
]