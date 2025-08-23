import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campus_clash.settings")

app = Celery("campus_clash")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()



from celery.schedules import crontab

# app.conf.beat_schedule = {
#     "generate-vibe-sets-10min": {
#         "task": "games.tasks.generate_vibe_sets",
#         "schedule": crontab(minute="*/10"),  # every 10 minutes
#     },
# }

app.conf.beat_schedule = {
    "generate-vibe-sets-daily-midnight": {
        "task": "games.tasks.generate_vibe_sets",
        "schedule": crontab(hour=18, minute=30),  # midnight IST = 18:30 UTC
    },
}

