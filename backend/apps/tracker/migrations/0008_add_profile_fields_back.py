from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tracker", "0007_remove_unused_profile_and_snapshot_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="avatar_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="profile",
            name="google_id",
            field=models.CharField(max_length=100, blank=True),
        ),
    ]
