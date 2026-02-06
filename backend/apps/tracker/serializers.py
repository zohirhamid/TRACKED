from rest_framework import serializers
from .models import Profile, Tracker, DailySnapshot, Entry


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'user', 'avatar_url', 'google_id']


class TrackerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tracker
        fields = [
            'id', 'user', 'name', 'tracker_type', 'unit', 
            'display_order', 'is_active', 'min_value', 'max_value', 'created_at'
        ]


class EntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entry
        fields = [
            'id', 'tracker', 'daily_snapshot',
            'binary_value', 'number_value', 'time_value', 
            'duration_minutes', 'text_value', 'rating_value',
            'created_at', 'updated_at'
        ]


class DailySnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailySnapshot
        fields = ['id', 'user', 'date', 'overall_notes', 'is_complete']