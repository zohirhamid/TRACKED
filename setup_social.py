from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
import os

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

print(f"Site: {site.domain}")
print(f"Google App: {google_app.name} (Created: {created})")
print(f"Client ID: {google_app.client_id[:20]}..." if google_app.client_id else "No Client ID!")
