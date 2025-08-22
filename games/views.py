import random
import requests

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



import uuid
import logging

logger = logging.getLogger(__name__)

DEFAULT_TTS_CONFIG = {
    'voice_key': 'rfkTsdZrVWEVhDycUYn9',
    'type': 'Eleven-Labs',
    'metadata': {
        'similarity_boost': 0,
        'stability': 1,
        'use_speaker_boost': False,
        'style': 0
    }
}

# Define the two prompts
serious_prompt = "Please describe a challenging professional experience and how you overcame it."
conversational_prompt = "Tell me about a fun project you enjoyed working on recently."

headers = {
        'Content-Type': 'application/json',
        'appid': 491,
    }


SESSION_URL = "http://staging.mnj.restapis.services.resdex.com/dhwani-realtime-services/dhwani-dynamic/v1/set_user_session_config"

def get_prompt(context="serious"):
    """
    Return prompt text based on the context.
    
    Args:
        context (str): Either 'serious' or 'conversational'. Defaults to 'serious'.
        
    Returns:
        str: The selected prompt text.
    """
    if context.lower() == "conversational":
        return conversational_prompt
    else:
        return serious_prompt

def prepare_session_request_data(tts_config=None, context="serious"):
    """
    Prepare request data for Dhwani session configuration with UUID-based context and selected prompt.
    
    Args:
        tts_config (dict, optional): Custom TTS configuration.
        context (str): 'serious' or 'conversational' to select prompt type.
        
    Returns:
        dict: Prepared session request payload.
    """
    try:
        context_id = str(uuid.uuid4())
        prompt_id = str(uuid.uuid4())
        tts_config = tts_config or DEFAULT_TTS_CONFIG

        try:
            prompt = get_prompt(context)
            logger.info("Prompt generated successfully", extra={"prompt": prompt})
        except Exception as e:
            logger.exception("Failed to generate prompt", extra={"error": str(e)})
            prompt = None

        request_data = {
            "context_id": context_id,
            "interruption_enabled": True,
            "prompt_id": 123456,
            "eval_prompt_id": "",
            "prompt_context": {},
            "metadata": {
                "context": "ai-interview"
            },
            "interaction_model_config": {
                "tts": tts_config
            }
        }

        if prompt:
            request_data["prompt"] = prompt

        return request_data

    except Exception as e:
        logger.exception("Failed to prepare session request data", extra={"error": str(e)})
        raise Exception(f"Failed to prepare session request data: {str(e)}")



@api_view(["POST"])
def create_session(request):
    """
    API View to create session and call the external API.
    Accepts 'context' ('serious' or 'conversational') and 'username' in the request body.
    """

    # Get parameters from request body
    context = request.data.get('context', 'serious')  # Default to 'serious'
    username = request.data.get('username')

    if not username:
        return Response({"error": "username is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Prepare the session request data
        context_id = str(uuid.uuid4())
        prompt = get_scenario_prompt()

        request_data = {
            "context_id": context_id,
            "interruption_enabled": True,
            "prompt_id": str(uuid.uuid4()),
            "eval_prompt_id": "",
            "prompt_context": {},
            "metadata": {
                "context": "ai-interview"
            },
            "interaction_model_config": {
                "tts": DEFAULT_TTS_CONFIG
            },
            "prompt": prompt
        }

        # Prepare headers for the request
        headers = {
            'Content-Type': 'application/json',
            'appid': '491',  # Assuming 'appid' is a static value
        }

        # Send the request to the external service (SESSION_URL)
        response = requests.post(SESSION_URL, json=request_data, headers=headers)
        
        # Handle the response
        if response.status_code == 200:
            return Response(response.json(), status=status.HTTP_200_OK)
        else:
            logger.error(f"Failed to get response: {response.text}")
            return Response({"error": "Failed to get a valid response from the external service."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        logger.exception("Failed to create session", extra={"error": str(e)})
        return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



scenario_creator_prompt = """
You are an AI Scenario Creator for "Naukri Campus Conversify." Your job is to make one unique, fun, and realistic role-play situation for Indian college students (1st, 2nd, 3rd year) or recent graduates.

Your Goal: Create a scenario where you (the AI) play a specific person, and the student (the user) interacts with you. This should help students practice important real-world skills.

Important points for you (the AI):
Who is it for? Indian college students and recent graduates.
What topics can you use? Pick one from this list:
College projects
Campus events
Learning new skills
Choosing internships
Finding a job
Working in a team
Ethical decisions (doing the right thing)
Balancing studies and life
Career goals
Leadership skills
Learning methods
Giving/getting feedback
Digital communication
Adapting to changes
Handling challenges (setbacks)
Networking (meeting people professionally)
Personal growth

What NOT to include: Anything inappropriate, too personal, political, or scenarios that just need a factual answer. Focus on how the student approaches situations, makes choices, or talks about their skills/ideas.

Here's the EXACT format for each scenario you create:

Title : [A short, catchy title, e.g., "Project Deadline Dilemma"]

Description: [What the student will practice in this role-play, e.g., "Practicing persuasion and negotiation skills."]

Role & Persona:
[Describe who you (the AI) will be playing in this scenario. Include:
*   **Your Role:** (e.g., "You are Professor Sharma, a strict but understanding professor for the final year project.")
*   **Your Personality:** (e.g., "Professional, a bit traditional, values discipline but is open to logical arguments.")
*   **Your Communication Style:** (e.g., "Formal yet fair, typically speaks in a clear, measured Indian academic tone.")]

Core Mission:
[What is your main goal as the AI persona in this interaction? What are you trying to understand or assess from the student?]

Interaction Style & Rules:
*   **Your Role in Conversation:** Be an interviewer/interactor who listens carefully but also asks probing, challenging questions.
*   **Question Limit:** After *each* student response, ask only **1 or 2 focused questions**. Never more than two.
*   **What to ask for:** Always push the student for specific details, practical examples, and clear explanations of their approach.
*   **What to look for:** (e.g., "Logical reasoning," "Problem-solving," "Communication clarity," "Professionalism," "Confidence.")

Opening Line:
[The exact first sentence you (the AI) will say to start the role-play. It should set the scene and immediately ask a thought-provoking question related to your mission.]

How you (the AI) should respond based on student's input:
*   **If the student's answer is vague or lacks details:**
    *   "Could you give a concrete example of that, perhaps from your college experience?"
    *   "How exactly would you implement that idea, step-by-step?"
    *   "What specific actions would you take first in such a situation?"
    *   "Can you elaborate on the 'why' behind that choice?"

*   **If the student's answer is good (has good ideas, some examples/details):**
    *   "That's a thoughtful approach. How would you ensure its success, especially if unexpected issues arise?"
    *   "Interesting point. What potential drawbacks do you see with that plan, and how would you mitigate them?"

*   **If the student stalls or struggles to provide information:**
    *   "Take a moment. What's the very first thing that comes to your mind when you think about solving X problem/situation?"
    *   "Let's simplify. What's one key lesson you've learned from a similar challenge?"
"""


def get_scenario_prompt():
    """
    Call Gemini to generate one scenario prompt for Naukri Campus Conversify.
    Returns the exact text response that can be used as a prompt for another LLM.
    """

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or genai is None:
        logger.error("Gemini API not configured or SDK missing.")
        return None

    try:
        logger.info("Requesting scenario prompt from Gemini API...")
        genai.configure(api_key=api_key)

        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        model = genai.GenerativeModel(model_name)

        # here you would pass your "scenario creator" prompt instead of vibe_question_prompt
        response = model.generate_content(scenario_creator_prompt)  
        text = (response.text or "").strip()

        logger.debug(f"Gemini scenario raw response: {text[:300]}...")

        return text  # returning the raw scenario prompt

    except Exception as e:
        logger.exception(f"Gemini call failed: {e}")
        return None

















@api_view(["GET"])
def get_user(request):
    # Hackathon demo: always return the same realistic username
    return Response({"user_name": "Aarav Mehta"})

