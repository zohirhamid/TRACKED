import os
import django
from datetime import datetime, time, date
from decimal import Decimal
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from tracker.models import Tracker, DailySnapshot, Entry

User = get_user_model()

print("=" * 60)
print("CLEARING AND REPOPULATING DATABASE")
print("=" * 60)

# Get demo user
try:
    user = User.objects.get(username='demo')
    print(f"\n✓ Found user: {user.username}")
except User.DoesNotExist:
    user = User.objects.create_user(
        username='demo',
        email='demo@tracked.app',
        password='demo123'
    )
    print(f"\n✓ Created user: {user.username}")

# DELETE ALL DATA FOR THIS USER
print("\n🗑️  Deleting all existing data...")
deleted_trackers = Tracker.objects.filter(user=user).count()
deleted_snapshots = DailySnapshot.objects.filter(user=user).count()

Tracker.objects.filter(user=user).delete()  # This cascades to entries
DailySnapshot.objects.filter(user=user).delete()

print(f"   - Deleted {deleted_trackers} trackers")
print(f"   - Deleted {deleted_snapshots} daily snapshots")

# CREATE TRACKERS
print("\n📊 Creating trackers...")

trackers_data = [
    {'name': 'Sleep', 'tracker_type': 'duration', 'unit': 'hrs', 'display_order': 1},
    {'name': 'Morning Routine', 'tracker_type': 'binary', 'unit': '', 'display_order': 2},
    {'name': 'Workout', 'tracker_type': 'binary', 'unit': '', 'display_order': 3},
    {'name': 'Meditation', 'tracker_type': 'binary', 'unit': '', 'display_order': 4},
    {'name': 'Water', 'tracker_type': 'number', 'unit': 'L', 'display_order': 5},
    {'name': 'Mood', 'tracker_type': 'number', 'unit': '/5', 'display_order': 6},
    {'name': 'Energy', 'tracker_type': 'number', 'unit': '/5', 'display_order': 7},
    {'name': 'Calories', 'tracker_type': 'number', 'unit': 'kcal', 'display_order': 8},
    {'name': 'Deep Work', 'tracker_type': 'duration', 'unit': 'hrs', 'display_order': 9},
    {'name': 'Reading', 'tracker_type': 'binary', 'unit': '', 'display_order': 10},
    {'name': 'Screen Time', 'tracker_type': 'duration', 'unit': 'hrs', 'display_order': 11},
    {'name': 'Planning', 'tracker_type': 'binary', 'unit': '', 'display_order': 12},
]

trackers = []
for tracker_data in trackers_data:
    tracker = Tracker.objects.create(user=user, **tracker_data)
    trackers.append(tracker)
    print(f"   ✓ {tracker.name}")

# GENERATE DATA FOR JUNE-DECEMBER 2025
print("\n📅 Generating data for June-December 2025...")

year = 2025
months = [
    (6, 30),   # June
    (7, 31),   # July
    (8, 31),   # August
    (9, 30),   # September
    (10, 31),  # October
    (11, 30),  # November
    (12, 31),  # December
]

total_days_populated = 0
total_days_possible = sum(days for _, days in months)

for month, days_in_month in months:
    month_name = date(year, month, 1).strftime('%B')
    print(f"\n   Processing {month_name} 2025...")
    month_days_populated = 0
    
    for day in range(1, days_in_month + 1):
        date_obj = date(year, month, day)
        
        # Get or create daily snapshot
        snapshot, _ = DailySnapshot.objects.get_or_create(
            user=user,
            date=date_obj
        )
        
        # Randomly skip some days (20% miss rate)
        if random.random() < 0.2:
            continue
        
        month_days_populated += 1
        total_days_populated += 1
        
        # Sleep (duration) - 6.5 to 8.5 hours
        sleep_hours = random.uniform(6.5, 8.5)
        sleep_minutes = int(sleep_hours * 60)
        Entry.objects.create(
            tracker=trackers[0],
            daily_snapshot=snapshot,
            duration_minutes=sleep_minutes
        )
        
        # Morning Routine (binary) - 70% success
        Entry.objects.create(
            tracker=trackers[1],
            daily_snapshot=snapshot,
            binary_value=random.random() < 0.7
        )
        
        # Workout (binary) - 60% success, less on weekends
        is_weekend = date_obj.weekday() >= 5
        workout_rate = 0.4 if is_weekend else 0.7
        Entry.objects.create(
            tracker=trackers[2],
            daily_snapshot=snapshot,
            binary_value=random.random() < workout_rate
        )
        
        # Meditation (binary) - 50% success
        Entry.objects.create(
            tracker=trackers[3],
            daily_snapshot=snapshot,
            binary_value=random.random() < 0.5
        )
        
        # Water (number) - 2-4 liters
        Entry.objects.create(
            tracker=trackers[4],
            daily_snapshot=snapshot,
            number_value=Decimal(str(round(random.uniform(2.0, 4.0), 1)))
        )
        
        # Mood (number) - 2.5-5 rating
        Entry.objects.create(
            tracker=trackers[5],
            daily_snapshot=snapshot,
            number_value=Decimal(str(round(random.uniform(2.5, 5.0), 1)))
        )
        
        # Energy (number) - 2.5-5 rating
        Entry.objects.create(
            tracker=trackers[6],
            daily_snapshot=snapshot,
            number_value=Decimal(str(round(random.uniform(2.5, 5.0), 1)))
        )
        
        # Calories (number) - 1800-2800
        Entry.objects.create(
            tracker=trackers[7],
            daily_snapshot=snapshot,
            number_value=Decimal(str(random.randint(1800, 2800)))
        )
        
        # Deep Work (duration) - 2-6 hours on weekdays
        if not is_weekend and random.random() < 0.8:
            work_hours = random.uniform(2, 6)
            work_minutes = int(work_hours * 60)
            Entry.objects.create(
                tracker=trackers[8],
                daily_snapshot=snapshot,
                duration_minutes=work_minutes
            )
        
        # Reading (binary) - 40% success
        Entry.objects.create(
            tracker=trackers[9],
            daily_snapshot=snapshot,
            binary_value=random.random() < 0.4
        )
        
        # Screen Time (duration) - 3-8 hours
        screen_hours = random.uniform(3, 8)
        screen_minutes = int(screen_hours * 60)
        Entry.objects.create(
            tracker=trackers[10],
            daily_snapshot=snapshot,
            duration_minutes=screen_minutes
        )
        
        # Planning (binary) - 65% success
        Entry.objects.create(
            tracker=trackers[11],
            daily_snapshot=snapshot,
            binary_value=random.random() < 0.65
        )
    
    print(f"      ✓ Populated {month_days_populated} days in {month_name}")

# SUMMARY
print("\n" + "=" * 60)
print("✅ DATABASE SUCCESSFULLY REPOPULATED!")
print("=" * 60)
print(f"\nUser: {user.username}")
print(f"Password: demo123")
print(f"Trackers: {len(trackers)}")
print(f"Days with data: {total_days_populated}/{total_days_possible}")
print(f"Coverage: {(total_days_populated/total_days_possible)*100:.1f}%")
print(f"\nLogin at: http://localhost:8000/login/")
print("=" * 60)