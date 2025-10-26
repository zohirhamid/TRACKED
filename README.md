# TRACKED

A simple habit and activity tracking app built with Django. Track your daily habits, metrics, and activities in a spreadsheet-style interface.

Inspired by [Sam Ovens' tracking system](https://www.youtube.com/watch?v=l6lV30ds3XI&t=2904s).

## What it does

Track anything you want in a clean monthly calendar view:
- **Yes/No habits** - Did I exercise? Did I meditate?
- **Numbers** - How many glasses of water? Hours of work?
- **Times** - What time did I wake up?
- **Durations** - Work hours, sleep time

Click any cell to add or edit entries. View patterns across the month at a glance.

## Setup

```bash
# Clone the repo
git clone https://github.com/zohirhamid/TRACKED.git
cd tracked

# Install Django
pip install django

# Run migrations
python manage.py migrate

# Start the server
python manage.py runserver
```

Open `http://localhost:8000` in your browser.

## Usage

1. Click "Add Tracker" to create a new tracker
2. Choose the type (Binary, Number, Time, or Duration)
3. Click any cell in the grid to log an entry
4. Use the month navigation to view different months

That's it!