from django.contrib import admin
from .models import Profile, Tracker, DailySnapshot, Entry


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'google_id')
    search_fields = ('user__email',)


@admin.register(Tracker)
class TrackerAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'tracker_type', 'is_active')
    list_filter = ('tracker_type', 'is_active')
    search_fields = ('name', 'user__email')


@admin.register(DailySnapshot)
class DailySnapshotAdmin(admin.ModelAdmin):
    list_display = ('user', 'date')
    list_filter = ('date',)
    search_fields = ('user__email',)
    date_hierarchy = 'date'


@admin.register(Entry)
class EntryAdmin(admin.ModelAdmin):
    list_display = ('tracker', 'daily_snapshot', 'updated_at')
    list_filter = ('tracker__tracker_type',)
    search_fields = ('tracker__name',)
