import random
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import VibeSession

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import DailyGameScore

from rest_framework.decorators import api_view
from rest_framework.response import Response



TOPICS = [
    "campus life", "gaming", "sports", "music", "friendship",
    "college fest", "food", "career goals", "movies", "weekend plans"
]

def _random_topic() -> str:
    return random.choice(TOPICS)

def _fallback_sets(topic: str, count: int = 10):
    return {
        "topic": topic,
        "sets": [
            {
                "id": i,
                "question": f"Vibe check: what's your move on {topic}?",
                "answers": [
                    {"text": f"Go all in on {topic}!"},
                    {"text": f"Nah, chill and skip {topic}."}
                ],
            }
            for i in range(1, count + 1)
        ],
    }

@api_view(["GET"])
def vibe_sets(request):
    """
    - Return the latest session from DB if it exists and is valid.
    - If no session exists, just return a default random set.
    - Never creates anything in the DB.
    """
    # Try to fetch the latest session
    try:
        session = VibeSession.objects.order_by("-created_at").first()
        if session and isinstance(session.sets_json, dict) and "sets" in session.sets_json:
            return Response(session.sets_json, status=status.HTTP_200_OK)
    except Exception:
        # If DB not available or broken, fallback anyway
        pass

    # No session → return a safe default (not stored in DB)
    topic = _random_topic()
    default_payload = _fallback_sets(topic, 10)
    return Response(default_payload, status=status.HTTP_200_OK)



from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import DailyGameScore

@api_view(["POST"])
def update_user_profile(request):
    """
    Request payload:
    {
      "user_name": "john",    # Required
      "game_name": "vibe",    # Required: game name (vibe, conversify)
      "batch": "batch1"       # Optional, batch/badge (up to 5)
    }
    """
    data = request.data
    user_name = data.get("user_name")
    game_name = data.get("game_name")   # Game name: vibe, conversify, etc.
    batch_key = data.get("batch")       # Batch key: optional

    if not user_name or not game_name:
        return Response({"error": "user_name and game_name are required"}, status=400)

    # Get or create the score record for today
    today = timezone.now().date()
    score_obj, _ = DailyGameScore.objects.get_or_create(user_name=user_name, date=today)

    # Add score based on the game type
    if game_name.lower() == "vibe":
        score_obj.score += 100  # Add 100 XP for "Vibe Check"
    elif game_name.lower() == "conversify":
        score_obj.score += 50  # Add 50 XP for "Conversify"
    else:
        return Response({"error": "Invalid game_name provided"}, status=400)

    # Increment game count by 1
    score_obj.game_count += 1

    # Handle batches (badges) JSON (track up to 5 badges)
    if batch_key:
        batches = score_obj.batches or {}
        if len(batches) < 5 or batch_key in batches:
            batches[batch_key] = batches.get(batch_key, 0) + 1
            score_obj.batches = batches

    score_obj.save()

    return Response({
        "user_name": score_obj.user_name,
        "date": str(score_obj.date),
        "score_today": score_obj.score,
        "game_count": score_obj.game_count,
        "batches": score_obj.batches,
        "total_score": score_obj.total_score,
    })



import random
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import DailyGameScore
from django.db.models import Sum

@api_view(["GET"])
def get_user_profile(request):
    """
    Request:
    {
      "user_name": "john"
    }

    Response:
    {
      "user_name": "john",
      "total_xp": 1000,
      "game_count": 20,
      "batches": {"batch1": 2, "batch2": 1},
      "streak": 10,
      "ranking": 473
    }
    """
    user_name = request.GET.get("user_name")

    if not user_name:
        return Response({"error": "user_name is required"}, status=400)

    # Get the user's total XP (sum of all scores)
    total_xp = DailyGameScore.objects.filter(user_name=user_name).aggregate(total=Sum('score'))["total"] or 0

    # Get the total number of games played by the user
    game_count = DailyGameScore.objects.filter(user_name=user_name).count()

    # Get batches (badges) and their counts for the user
    batches = DailyGameScore.objects.filter(user_name=user_name).values('batches')
    
    # Aggregate batches (badges) and their counts
    aggregated_batches = {}
    for batch in batches:
        batch_data = batch.get('batches', {})
        for batch_name, count in batch_data.items():
            aggregated_batches[batch_name] = aggregated_batches.get(batch_name, 0) + count

    # Optionally, calculate the streak (this is a placeholder logic)
    streak = 10  # Placeholder, replace with actual logic to calculate streak

    # Generate a random ranking between 1 and 1000
    ranking = random.randint(1, 1000)

    return Response({
        "user_name": user_name,
        "total_xp": total_xp,
        "game_count": game_count,
        "batches": aggregated_batches,  # Showing batches with their count
        "streak": streak,
        "ranking": ranking  # Random ranking between 1 and 1000
    })



import random
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import DailyGameScore
from django.db.models import Sum

# Dummy user data with some random XP and game count
DUMMY_USERS = [
    {"user_name": "Priya Sharma", "total_xp": 2840, "game_count": 47, "batches": {"batch1": 2}, "streak": 12},
    {"user_name": "Arjun Patel", "total_xp": 2650, "game_count": 45, "batches": {"batch1": 3}, "streak": 10},
    {"user_name": "Sneha Gupta", "total_xp": 2480, "game_count": 42, "batches": {"batch1": 1}, "streak": 8},
    {"user_name": "Alex Kumar", "total_xp": 1290, "game_count": 30, "batches": {"batch2": 1}, "streak": 6},
    {"user_name": "Amit Kumar", "total_xp": 1500, "game_count": 25, "batches": {"batch3": 2}, "streak": 5},
    {"user_name": "Ravi Singh", "total_xp": 2100, "game_count": 40, "batches": {"batch4": 3}, "streak": 7},
    {"user_name": "Anjali Yadav", "total_xp": 2200, "game_count": 38, "batches": {"batch5": 2}, "streak": 9},
    {"user_name": "Neha Gupta", "total_xp": 1800, "game_count": 32, "batches": {"batch1": 4}, "streak": 6},
    {"user_name": "Vishal Kumar", "total_xp": 2000, "game_count": 34, "batches": {"batch2": 1}, "streak": 7},
    {"user_name": "Manoj Sharma", "total_xp": 1600, "game_count": 28, "batches": {"batch3": 3}, "streak": 5},
]

@api_view(["GET"])
def leaderboard(request):
    # Get all users from the database with their total XP, game count, batches, and streak
    real_data = DailyGameScore.objects.values('id', 'user_name')\
        .annotate(total_xp=Sum('score'))\
        .order_by('-total_xp')  # Sorting by total XP

    leaderboard = []
    
    # Append real data from the database
    for user in real_data:
        user_name = user['user_name']
        total_xp = user['total_xp']
        user_id = user['id']  # Add ID from database

        # Fetch the user's game count
        game_count = DailyGameScore.objects.filter(user_name=user_name).count()

        # Fetch the user's batches (aggregate batches into a dictionary)
        batches = DailyGameScore.objects.filter(user_name=user_name).values('batches')
        batch_data = {}
        for batch in batches:
            for batch_key, count in batch['batches'].items():
                batch_data[batch_key] = batch_data.get(batch_key, 0) + count

        # Placeholder for streak (implement your own streak logic)
        streak = 10  # Placeholder value, replace it with your streak logic

        # Generate random ranking between 1 and 1000
        ranking = random.randint(1, 1000)

        leaderboard.append({
            'id': user_id,  # Include the database ID
            'user_name': user_name,
            'total_xp': total_xp,
            'game_count': game_count,
            'batches': batch_data,  # Store batches as a dictionary
            'streak': streak,
            'ranking': ranking,
        })
    
    # Now add dummy users data to the leaderboard for testing
    for idx, dummy_user in enumerate(DUMMY_USERS, start=len(real_data) + 1):  # Start id after real data
        leaderboard.append({
            'id': idx,  # Sequential ID for dummy users
            'user_name': dummy_user['user_name'],
            'total_xp': dummy_user['total_xp'],
            'game_count': dummy_user['game_count'],
            'batches': dummy_user['batches'],
            'streak': dummy_user['streak'],
            'ranking': random.randint(1, 1000)  # Random ranking for dummy user
        })
    
    # Sort by total XP to simulate leaderboard (XP based)
    leaderboard.sort(key=lambda x: x['total_xp'], reverse=True)

    return Response(leaderboard)

















@api_view(["GET"])
def get_user(request):
    # Hackathon demo: always return the same realistic username
    return Response({"user_name": "Aarav Mehta"})

