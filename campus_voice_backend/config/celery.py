import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('config')

# Read config from Django settings, using the CELERY_ namespace.
# e.g. CELERY_BROKER_URL in settings.py becomes broker_url in Celery.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks.py in all installed apps.
app.autodiscover_tasks()
