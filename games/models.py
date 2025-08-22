from django.db import models
from django.db import models
from django.utils import timezone
from django.db.models import Sum


class VibeSession(models.Model):
    topic = models.CharField(max_length=255)
    sets_json = models.JSONField()          # stores the entire 10 sets as JSON
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"VibeSession(topic={self.topic}, created={self.created_at})"


from django.db import models
from django.utils import timezone
from django.db.models import Sum

class DailyGameScore(models.Model):
    user_name = models.CharField(max_length=100)
    date = models.DateField(default=timezone.now)
    score = models.IntegerField(default=0)
    game_count = models.IntegerField(default=0)  # Game count
    batches = models.JSONField(default=dict)  # Batches like {"batch1": 1, "batch2": 2}

    class Meta:
        unique_together = ("user_name", "date")

    @property
    def total_score(self):
        return DailyGameScore.objects.filter(user_name=self.user_name).aggregate(total=Sum("score"))["total"] or 0


