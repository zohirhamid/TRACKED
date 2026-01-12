import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

# PATH CONFIGURATION
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv()

# CORE SETTINGS
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not set")

DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'tracked-production.up.railway.app',
    '.railway.app',
]

# CSRF Configuration
CSRF_TRUSTED_ORIGINS = [
    'https://tracked-production.up.railway.app',
    'https://*.railway.app',
]

# API KEYS
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')

# APPLICATION DEFINITION
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',

    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    
    # Local apps
    'tracker',
]

# MIDDLEWARE
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

# Authentication backends
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

SITE_ID = 1

# Allauth settings
ACCOUNT_EMAIL_VERIFICATION = 'optional'
SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_LOGIN_ON_GET = True

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        },
        'FETCH_USERINFO': True,
    }
}

# URL & WSGI CONFIGURATION
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'


# TEMPLATES
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates',],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# DATABASE CONFIGURATION
USE_POSTGRES = os.environ.get('USE_POSTGRES', 'False') == 'True'

if USE_POSTGRES:
    DATABASES = {
        'default': dj_database_url.config(
            default=os.environ.get('DATABASE_URL'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# STATIC FILES CONFIGURATION
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ADDITIONAL LOCATIONS OF STATIC FILES
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# WHITENOISE CONFIG
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# INTERNATIONALIZATION
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Authentication URLs
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/accounts/login/'
LOGIN_URL = '/accounts/login/'

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# OTHER
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'