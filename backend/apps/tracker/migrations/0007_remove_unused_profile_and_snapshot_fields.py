from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("tracker", "0006_add_prayer_tracker"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="profile",
            name="avatar_url",
        ),
        migrations.RemoveField(
            model_name="profile",
            name="google_id",
        ),
        migrations.RemoveField(
            model_name="dailysnapshot",
            name="is_complete",
        ),
        migrations.RemoveField(
            model_name="dailysnapshot",
            name="overall_notes",
        ),
    ]
