# apps/tracker/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Profile

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create a Profile whenever a new User is created.
    """
    if created:
        Profile.objects.create(user=instance)

# Optional: save the profile if user is updated (keeps in sync)
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Ensure profile is saved whenever the User is saved.
    """
    try:
        instance.profile.save()
    except Profile.DoesNotExist:
        # If profile does not exist, create it
        Profile.objects.create(user=instance)

# Populate profiles for existing users (run once)
def populate_existing_profiles():
    for user in User.objects.all():
        Profile.objects.get_or_create(user=user)
