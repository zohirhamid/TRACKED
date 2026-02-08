"""
Management command to create a demo user with realistic tracking data.

Usage:
    python manage.py create_demo_user

Creates:
    - A test user (demo@example.com / demo1234)
    - 12 trackers covering sleep, fitness, productivity, wellness
    - Full January 2026 of realistic, correlated data
"""

import random
from datetime import date, time, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.tracker.models import Tracker, DailySnapshot, Entry

User = get_user_model()

DEMO_EMAIL = 'demo@example.com'
DEMO_USERNAME = 'demo'
DEMO_PASSWORD = 'london2024'


class Command(BaseCommand):
    help = 'Create a demo user with a full month of realistic tracking data'

    def handle(self, *args, **options):
        # Clean up existing demo user
        User.objects.filter(username=DEMO_USERNAME).delete()
        self.stdout.write('Cleaned up existing demo user (if any)')

        # Create user
        user = User.objects.create_user(
            username=DEMO_USERNAME,
            email=DEMO_EMAIL,
            password=DEMO_PASSWORD,
        )
        self.stdout.write(f'Created user: {DEMO_EMAIL} / {DEMO_PASSWORD}')

        # Create trackers
        trackers = self.create_trackers(user)
        self.stdout.write(f'Created {len(trackers)} trackers')

        # Generate January 2026 data
        days_created = self.generate_month_data(user, trackers, 2026, 1)
        self.stdout.write(f'Generated data for {days_created} days in January 2026')

        self.stdout.write(self.style.SUCCESS('\nDone! Login with demo@example.com / london2024'))

    def create_trackers(self, user):
        tracker_defs = [
            # Sleep cluster
            {'name': 'Sleep Time', 'tracker_type': 'time', 'display_order': 1},
            {'name': 'Wake Up', 'tracker_type': 'time', 'display_order': 2},
            {'name': 'Sleep Duration', 'tracker_type': 'duration', 'unit': 'min', 'display_order': 3},
            # Wellness
            {'name': 'Mood', 'tracker_type': 'rating', 'min_value': 1, 'max_value': 10, 'display_order': 4},
            {'name': 'Exercise', 'tracker_type': 'binary', 'display_order': 5},
            {'name': 'Steps', 'tracker_type': 'number', 'unit': 'steps', 'display_order': 6},
            {'name': 'Water', 'tracker_type': 'number', 'unit': 'glasses', 'display_order': 7},
            {'name': 'Screen Time', 'tracker_type': 'duration', 'unit': 'min', 'display_order': 8},
            # Productivity
            {'name': 'Planned Day', 'tracker_type': 'binary', 'display_order': 9},
            {'name': 'Deep Work', 'tracker_type': 'duration', 'unit': 'min', 'display_order': 10},
            {'name': 'Tasks Done', 'tracker_type': 'number', 'unit': '%', 'display_order': 11},
            # Reflection
            {'name': 'Notes', 'tracker_type': 'text', 'display_order': 12},
        ]

        trackers = {}
        for t in tracker_defs:
            tracker = Tracker.objects.create(user=user, **t)
            trackers[t['name']] = tracker

        return trackers

    def generate_month_data(self, user, trackers, year, month):
        """Generate a full month of realistic, correlated data."""

        num_days = (date(year, month + 1, 1) - timedelta(days=1)).day if month < 12 else 31

        # Notes pool for variety
        notes_pool = [
            'Good productive day, felt focused.',
            'Tired today, didn\'t sleep well last night.',
            'Crushed my morning routine!',
            'Lazy day, needed the rest though.',
            'Had a great workout, energy was high.',
            'Stressful day at work, need to decompress.',
            'Felt creative and motivated.',
            'Struggled to focus, too much screen time.',
            'Went for a long walk, cleared my head.',
            'Solid day overall, steady progress.',
            'Woke up late, threw off the whole day.',
            'Best day this week, everything clicked.',
            'Felt anxious, journaling helped.',
            'Meal prepped and planned the week ahead.',
            'Low energy but still got the basics done.',
            'Social day - good for morale.',
            'Deep work session was incredibly productive.',
            'Need to cut back on phone usage.',
            'Meditated for 10 min, felt calmer.',
            'Pushed through resistance, glad I did.',
            '',  # Some days no notes
            '',
            '',
            '',
            '',
        ]

        # Simulate a realistic pattern: 
        # - Week 1: settling in, moderate habits
        # - Week 2: building momentum, improving
        # - Week 3: peak performance
        # - Week 4: slight dip, recovery
        # This creates interesting trends for the AI to analyze

        for day in range(1, num_days + 1):
            date_obj = date(year, month, day)
            weekday = date_obj.weekday()  # 0=Mon, 6=Sun
            is_weekend = weekday >= 5
            week_num = (day - 1) // 7  # 0-3

            # Base quality factor by week (creates a trend)
            week_quality = {0: 0.5, 1: 0.7, 2: 0.9, 3: 0.65}.get(week_num, 0.7)

            # Random daily variance
            daily_variance = random.uniform(-0.15, 0.15)
            quality = max(0.2, min(1.0, week_quality + daily_variance))

            # Create snapshot
            snapshot = DailySnapshot.objects.create(user=user, date=date_obj)

            # --- Sleep Time ---
            # Better quality = earlier sleep (22:00-23:00), worse = later (23:30-01:00)
            sleep_hour = int(22 + (1 - quality) * 3)
            sleep_min = random.choice([0, 15, 30, 45])
            if sleep_hour >= 24:
                sleep_hour -= 24
            sleep_time = time(sleep_hour, sleep_min)
            Entry.objects.create(
                tracker=trackers['Sleep Time'],
                daily_snapshot=snapshot,
                time_value=sleep_time,
            )

            # --- Wake Up Time ---
            # Better quality = earlier wake (6:00-6:30), worse = later (7:30-8:30)
            # Weekends: +1 hour
            wake_base = 6.0 + (1 - quality) * 2.5
            if is_weekend:
                wake_base += 1.0
            wake_hour = int(wake_base)
            wake_min = random.choice([0, 15, 30, 45])
            wake_time = time(wake_hour, wake_min)
            Entry.objects.create(
                tracker=trackers['Wake Up'],
                daily_snapshot=snapshot,
                time_value=wake_time,
            )

            # --- Sleep Duration ---
            # Target 7-8h on good days, 5-6h on bad days
            sleep_duration = int((6 + quality * 2.5) * 60 + random.randint(-30, 30))
            sleep_duration = max(300, min(600, sleep_duration))  # 5h-10h range
            Entry.objects.create(
                tracker=trackers['Sleep Duration'],
                daily_snapshot=snapshot,
                duration_minutes=sleep_duration,
            )

            # --- Mood ---
            # Correlated with quality + sleep
            mood_base = 3 + quality * 6 + random.uniform(-1, 1)
            mood = max(1, min(10, round(mood_base)))
            Entry.objects.create(
                tracker=trackers['Mood'],
                daily_snapshot=snapshot,
                rating_value=mood,
            )

            # --- Exercise ---
            # Higher quality = more likely to exercise. Weekends slightly less.
            exercise_chance = quality * 0.8 if not is_weekend else quality * 0.5
            did_exercise = random.random() < exercise_chance
            Entry.objects.create(
                tracker=trackers['Exercise'],
                daily_snapshot=snapshot,
                binary_value=did_exercise,
            )

            # --- Steps ---
            # Exercise days: 7000-12000, non-exercise: 3000-6000
            if did_exercise:
                steps = random.randint(7000, 12000)
            else:
                steps = random.randint(2000, 6000)
            Entry.objects.create(
                tracker=trackers['Steps'],
                daily_snapshot=snapshot,
                number_value=Decimal(str(steps)),
            )

            # --- Water ---
            # Good days: 6-10 glasses, bad days: 3-5
            water = int(4 + quality * 6 + random.uniform(-1, 1))
            water = max(2, min(12, water))
            Entry.objects.create(
                tracker=trackers['Water'],
                daily_snapshot=snapshot,
                number_value=Decimal(str(water)),
            )

            # --- Screen Time ---
            # Inversely correlated with quality. Weekends higher.
            screen_base = (1 - quality) * 300 + 60
            if is_weekend:
                screen_base += 60
            screen_time = int(screen_base + random.randint(-30, 30))
            screen_time = max(30, min(480, screen_time))
            Entry.objects.create(
                tracker=trackers['Screen Time'],
                daily_snapshot=snapshot,
                duration_minutes=screen_time,
            )

            # --- Planned Day ---
            # Weekdays more likely, higher quality more likely
            plan_chance = quality * 0.9 if not is_weekend else quality * 0.3
            did_plan = random.random() < plan_chance
            Entry.objects.create(
                tracker=trackers['Planned Day'],
                daily_snapshot=snapshot,
                binary_value=did_plan,
            )

            # --- Deep Work ---
            # Only on weekdays mostly. Correlated with planning and quality.
            if is_weekend:
                deep_work = random.randint(0, 60) if random.random() < 0.3 else 0
            else:
                deep_base = quality * 180 + (30 if did_plan else 0)
                deep_work = int(deep_base + random.randint(-30, 30))
                deep_work = max(0, min(300, deep_work))
            
            if deep_work > 0:
                Entry.objects.create(
                    tracker=trackers['Deep Work'],
                    daily_snapshot=snapshot,
                    duration_minutes=deep_work,
                )

            # --- Tasks Done % ---
            # Correlated with planning + deep work + quality
            tasks_base = quality * 70 + (10 if did_plan else 0) + random.uniform(-10, 10)
            if is_weekend:
                tasks_base *= 0.6
            tasks_pct = max(0, min(100, round(tasks_base)))
            Entry.objects.create(
                tracker=trackers['Tasks Done'],
                daily_snapshot=snapshot,
                number_value=Decimal(str(tasks_pct)),
            )

            # --- Notes ---
            # Not every day has notes (roughly 60% of days)
            note = random.choice(notes_pool)
            if note:
                Entry.objects.create(
                    tracker=trackers['Notes'],
                    daily_snapshot=snapshot,
                    text_value=note,
                )

        return num_days