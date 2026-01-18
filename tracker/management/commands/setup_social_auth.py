from django.core.management.base import BaseCommand
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
import os

class Command(BaseCommand):
    help = 'Setup social authentication'

    def handle(self, *args, **options):
        site, _ = Site.objects.get_or_create(
            id=1,
            defaults={'domain': 'tracked.zohirhamid.com', 'name': 'Tracked'}
        )
        site.domain = 'tracked.zohirhamid.com'
        site.name = 'Tracked'
        site.save()

        google_app, created = SocialApp.objects.get_or_create(
            provider='google',
            defaults={
                'name': 'Google',
                'client_id': os.environ.get('GOOGLE_CLIENT_ID'),
                'secret': os.environ.get('GOOGLE_CLIENT_SECRET'),
            }
        )
        google_app.sites.add(site)
        
        self.stdout.write(self.style.SUCCESS(f'✓ Site configured: {site.domain}'))
        self.stdout.write(self.style.SUCCESS(f'✓ Google App {"created" if created else "already exists"}'))
