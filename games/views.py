# ===== Standard Library =====
import os
import re
import json
import uuid
import random
import logging
from collections import defaultdict

# ===== Third-Party Libraries =====
import requests
from faker import Faker

# ===== Django & DRF =====
from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models import Sum, OuterRef, Subquery

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.renderers import JSONRenderer
from rest_framework.decorators import api_view, renderer_classes

# ===== Project Imports =====
from .models import VibeSession, DailyGameScore, Transcript, Evaluation
from .serializers import TranscriptSerializer


try:
    import google.generativeai as genai
except Exception:
    genai = None


logger = logging.getLogger(__name__)



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
@renderer_classes([JSONRenderer])
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


@api_view(["POST"])
@renderer_classes([JSONRenderer])
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
        score_obj.score += 50  # Add 100 XP for "Vibe Check"
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



@api_view(["GET"])
@renderer_classes([JSONRenderer])
def leaderboard(request):
    """
    Leaderboard with ranking logic:
    1. Sort by total_xp (higher is better)
    2. If tie, sort by efficiency (xp/game_count, higher is better)
    3. If still tie, sort by game_count (higher is better)
    """

    # Subquery to fetch one campus_name per user (latest by id)
    campus_subquery = DailyGameScore.objects.filter(
        user_name=OuterRef("user_name")
    ).order_by("-id").values("campus_name")[:1]

    real_data = (
        DailyGameScore.objects
        .values("user_name")  # only group by user
        .annotate(
            total_xp=Sum("score"),
            game_count=Sum("game_count"),
            campus_name=Subquery(campus_subquery),
        )
    )

    leaderboard = []
    for user in real_data:
        total_xp = user["total_xp"] or 0
        game_count = user["game_count"] or 0
        efficiency = total_xp / game_count if game_count > 0 else 0

        leaderboard.append({
            "user_name": user["user_name"],
            "campus_name": user["campus_name"],  # ✅ campus name without grouping
            "total_xp": total_xp,
            "game_count": game_count,
            "efficiency": round(efficiency, 2),
        })

    # Sort with ranking logic
    leaderboard.sort(
        key=lambda x: (x["total_xp"], x["efficiency"], x["game_count"]),
        reverse=True
    )

    # Assign rank numbers
    for idx, user in enumerate(leaderboard, start=1):
        user["rank"] = idx

    return Response(leaderboard)



@api_view(["GET"])
@renderer_classes([JSONRenderer])
def get_user_profile(request):
    """
    Request:
    {
      "user_name": "john"
    }

    Response:
    {
      "user_name": "john",
      "campus_name": "IIT Bombay",
      "total_xp": 1000,
      "game_count": 20,
      "batches": {"batch1": 2, "batch2": 1},
      "streak": 10,
      "ranking": 2
    }
    """
    user_name = request.GET.get("user_name")

    if not user_name:
        return Response({"error": "user_name is required"}, status=400)

    # Get campus name for the user
    campus_name = DailyGameScore.objects.filter(user_name=user_name).values_list("campus_name", flat=True).first()

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

    # Placeholder streak logic
    streak = 10  

    # === Ranking logic (same as leaderboard) ===
    all_users = (
        DailyGameScore.objects.values("user_name")
        .annotate(total_xp=Sum("score"), game_count=Sum("game_count"))
    )

    leaderboard = []
    for u in all_users:
        xp = u["total_xp"] or 0
        games = u["game_count"] or 0
        efficiency = xp / games if games > 0 else 0
        leaderboard.append({
            "user_name": u["user_name"],
            "total_xp": xp,
            "game_count": games,
            "efficiency": efficiency,
        })

    leaderboard.sort(
        key=lambda x: (x["total_xp"], x["efficiency"], x["game_count"]),
        reverse=True
    )

    ranking = None
    for idx, u in enumerate(leaderboard, start=1):
        if u["user_name"] == user_name:
            ranking = idx
            break

    return Response({
        "user_name": user_name,
        "campus_name": campus_name,
        "total_xp": total_xp,
        "game_count": game_count,
        "batches": aggregated_batches,
        "streak": streak,
        "ranking": ranking
    })



@api_view(["GET"])
@renderer_classes([JSONRenderer])
def leaderboard_campus(request):
    # Dictionary to aggregate by campus
    campus_data = defaultdict(lambda: {"total_xp": 0, "game_count": 0, "streak": 0, "user_count": 0})

    # === FETCH USERS DIRECTLY FROM DB ===
    db_users = DailyGameScore.objects.values('campus_name', 'user_name')\
        .annotate(total_xp=Sum('score'), game_count=Count('id'))

    for user in db_users:
        campus_name = user['campus_name'] or "Unknown"

        campus_data[campus_name]["total_xp"] += user['total_xp'] or 0
        campus_data[campus_name]["game_count"] += user['game_count'] or 0
        # Placeholder streak logic (replace with your real streak calculation per user)
        campus_data[campus_name]["streak"] += 10
        campus_data[campus_name]["user_count"] += 1

    # === PREPARE FINAL RESPONSE ===
    leaderboard = []
    for campus_name, data in campus_data.items():
        leaderboard.append({
            "campus_name": campus_name,
            "total_xp": data["total_xp"],
            "game_count": data["game_count"],
            "avg_streak": round(data["streak"] / data["user_count"], 2) if data["user_count"] > 0 else 0,
            "user_count": data["user_count"],
        })

    # Sort by total XP
    leaderboard.sort(key=lambda x: x["total_xp"], reverse=True)

    # Assign sequential rankings after sorting
    for idx, campus in enumerate(leaderboard, start=1):
        campus["id"] = idx
        campus["ranking"] = idx

    return Response(leaderboard)



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
# serious_prompt = "Please describe a challenging professional experience and how you overcame it."
# conversational_prompt = "Tell me about a fun project you enjoyed working on recently."

headers = {
        'Content-Type': 'application/json',
        'appid': 491,
    }


SESSION_URL = "http://staging.mnj.restapis.services.resdex.com/dhwani-realtime-services/dhwani-dynamic/v1/set_user_session_config"

# def get_prompt(context="serious"):
#     """
#     Return prompt text based on the context.
    
#     Args:
#         context (str): Either 'serious' or 'conversational'. Defaults to 'serious'.
        
#     Returns:
#         str: The selected prompt text.
#     """
#     if context.lower() == "conversational":
#         return conversational_prompt
#     else:
#         return serious_prompt

# def prepare_session_request_data(tts_config=None, context="serious"):
#     """
#     Prepare request data for Dhwani session configuration with UUID-based context and selected prompt.
    
#     Args:
#         tts_config (dict, optional): Custom TTS configuration.
#         context (str): 'serious' or 'conversational' to select prompt type.
        
#     Returns:
#         dict: Prepared session request payload.
#     """
#     try:
#         context_id = str(uuid.uuid4())
#         prompt_id = str(uuid.uuid4())
#         tts_config = tts_config or DEFAULT_TTS_CONFIG

#         try:
#             prompt = get_prompt(context)
#             logger.info("Prompt generated successfully", extra={"prompt": prompt})
#         except Exception as e:
#             logger.exception("Failed to generate prompt", extra={"error": str(e)})
#             prompt = None

#         request_data = {
#             "context_id": context_id,
#             "interruption_enabled": True,
#             "prompt_id": 123456,
#             "eval_prompt_id": "",
#             "prompt_context": {},
#             "metadata": {
#                 "context": "ai-interview"
#             },
#             "interaction_model_config": {
#                 "tts": tts_config
#             }
#         }

#         if prompt:
#             request_data["prompt"] = prompt

#         return request_data

#     except Exception as e:
#         logger.exception("Failed to prepare session request data", extra={"error": str(e)})
#         raise Exception(f"Failed to prepare session request data: {str(e)}")



@api_view(["POST"])
@renderer_classes([JSONRenderer])
def create_session(request):
    """
    API View to create session and call the external API.
    Accepts 'context' ('serious' or 'conversational') and 'username' in the request body.
    Clears the user's transcript when starting a new session.
    """

    # Get parameters from request body
    context = request.data.get('context', 'serious')  # Default to 'serious'
    username = request.data.get('username')

    if not username:
        return Response({"error": "username is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Clear user's transcript for new session
        try:
            transcript, created = Transcript.objects.get_or_create(user_name=username)
            transcript.messages = []  # Reset messages to empty list
            transcript.save()
            logger.info(f"Cleared transcript for user: {username}")
        except Exception as transcript_error:
            logger.warning(f"Failed to clear transcript for user {username}: {transcript_error}")
            # Continue with session creation even if transcript clearing fails

        # Prepare the session request data
        context_id = str(uuid.uuid4())
        prompt = get_scenario_prompt()
        
        # Extract scenario title and description
        scenario_title = None
        scenario_description = None
        if prompt:
            # Extract title
            try:
                scenario_title = extract_scenario_title(prompt)
                logger.info(f"Extracted scenario title: {scenario_title}")
            except Exception as title_error:
                logger.warning(f"Failed to extract scenario title: {title_error}")
                # Continue with session creation even if title extraction fails
            
            # Extract description
            try:
                scenario_description = extract_scenario_description(prompt)
                logger.info(f"Extracted scenario description: {scenario_description}")
            except Exception as description_error:
                logger.warning(f"Failed to extract scenario description: {description_error}")
                # Continue with session creation even if description extraction fails

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
            response_data = response.json()
            # Add scenario title and description to the response
            if scenario_title:
                response_data["scenario_title"] = scenario_title
            if scenario_description:
                response_data["scenario_description"] = scenario_description
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            logger.error(f"Failed to get response: {response.text}")
            return Response({"error": "Failed to get a valid response from the external service."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        logger.exception("Failed to create session", extra={"error": str(e)})
        return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# scenario_creator_prompt = """
# You are an AI Scenario Creator for "Naukri Campus Conversify." Your job is to make one unique, fun, and realistic role-play situation for Indian college students (1st, 2nd, 3rd year) or recent graduates.

# Your Goal: Create a scenario where you (the AI) play a specific person, and the student (the user) interacts with you. This should help students practice important real-world skills.

# Important points for you (the AI):
# Who is it for? Indian college students and recent graduates.
# What topics can you use? Pick one from this list:
# College projects
# Campus events
# Learning new skills
# Choosing internships
# Finding a job
# Working in a team
# Ethical decisions (doing the right thing)
# Balancing studies and life
# Career goals
# Leadership skills
# Learning methods
# Giving/getting feedback
# Digital communication
# Adapting to changes
# Handling challenges (setbacks)
# Networking (meeting people professionally)
# Personal growth

# What NOT to include: Anything inappropriate, too personal, political, or scenarios that just need a factual answer. Focus on how the student approaches situations, makes choices, or talks about their skills/ideas.

# Here's the EXACT format for each scenario you create:

# Title : [A short, catchy title, e.g., "Project Deadline Dilemma"]

# Description: [What the student will practice in this role-play, e.g., "Practicing persuasion and negotiation skills."]

# Role & Persona:
# [Describe who you (the AI) will be playing in this scenario. Include:
# *   **Your Role:** (e.g., "You are Professor Sharma, a strict but understanding professor for the final year project.")
# *   **Your Personality:** (e.g., "Professional, a bit traditional, values discipline but is open to logical arguments.")
# *   **Your Communication Style:** (e.g., "Formal yet fair, typically speaks in a clear, measured Indian academic tone.")]

# Core Mission:
# [What is your main goal as the AI persona in this interaction? What are you trying to understand or assess from the student?]

# Interaction Style & Rules:
# *   **Your Role in Conversation:** Be an interviewer/interactor who listens carefully but also asks probing, challenging questions.
# *   **Question Limit:** After *each* student response, ask only **1 or 2 focused questions**. Never more than two.
# *   **What to ask for:** Always push the student for specific details, practical examples, and clear explanations of their approach.
# *   **What to look for:** (e.g., "Logical reasoning," "Problem-solving," "Communication clarity," "Professionalism," "Confidence.")

# Opening Line:
# [The exact first sentence you (the AI) will say to start the role-play. It should set the scene and immediately ask a thought-provoking question related to your mission.]

# How you (the AI) should respond based on student's input:
# *   **If the student's answer is vague or lacks details:**
#     *   "Could you give a concrete example of that, perhaps from your college experience?"
#     *   "How exactly would you implement that idea, step-by-step?"
#     *   "What specific actions would you take first in such a situation?"
#     *   "Can you elaborate on the 'why' behind that choice?"

# *   **If the student's answer is good (has good ideas, some examples/details):**
#     *   "That's a thoughtful approach. How would you ensure its success, especially if unexpected issues arise?"
#     *   "Interesting point. What potential drawbacks do you see with that plan, and how would you mitigate them?"

# *   **If the student stalls or struggles to provide information:**
#     *   "Take a moment. What's the very first thing that comes to your mind when you think about solving X problem/situation?"
#     *   "Let's simplify. What's one key lesson you've learned from a similar challenge?"
# """


scenario_creator_prompt = """You are an AI Scenario Creator for "Naukri Campus Conversify." Your job is to make one unique, fun, and realistic role-play situation for Indian college students (1st, 2nd, 3rd year) or recent graduates.
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
*   **AI's Strict Internal Rule: After the opening line, the AI will strictly wait for 3 seconds before processing any immediate response from the user. This simulates a natural pause for the user to absorb the prompt.**
*   **Crucial Constraint: Do NOT provide any solution, answer, or direct advice to the student, even if they explicitly ask for help or struggle. Your role is to assess their response, not to provide the 'correct' one.**
*   **Handling Help Requests:** If the student asks for help, clarification on what *they* should do, or indicates they are stuck:
    *   Respond empathetically. (e.g., "I understand this can be a challenging situation...")
    *   Gently but firmly redirect them to formulate their *own* approach. (e.g., "...focus on what *you* would do in this scenario. There's no single right answer, and I'm interested in your perspective and how you'd approach it.")
*   **Your Role in Conversation:** Be an interviewer/interactor who listens carefully but also asks probing, challenging questions.
*   **Question Limit:** After *each* student response, ask only **1 or 2 focused questions**. Never more than two.
*   **What to ask for:** Always push the student for specific details, practical examples, and clear explanations of their approach.
*   **What to look for:** (e.g., "Logical reasoning," "Problem-solving," "Communication clarity," "Professionalism," "Confidence.")
*   **If the user refuses to answer:** Gently encourage them to share their thoughts or approach. (e.g., "It's alright if you're unsure, just share your initial thoughts on how you might tackle this.")
*   **If asked to restart or pause:** Motivate them to continue from the current state. (e.g., "Let's keep going from here, you're doing well. What are your next thoughts?")
*   **If the candidate speaks another language:** Remind: "Please respond only in English so we can continue."
*   **If inappropriate content is detected:** Redirect politely back to the question. (e.g., "Let's refocus on the scenario at hand. How would you approach X?")
*   **If they ask about scoring, feedback, or company process:** Say: "That's outside the scope of this session."
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
## No answer / Silence handling:
*   **If there is no answer after a pause (e.g., 120 seconds of silence after a question):** Move on to the next question by saying: "You have not responded to the last question. Let's move on. [Ask next question related to the scenario or a probing follow-up.]"
*   **If a response is unclear:** Say: "I'm sorry, could you please clarify your answer?"
*   **If silence or pause exceeds reasonable time of 120 seconds (mid-response):** Say "Take your time. Let me know when you're ready."
*   **If the user is unclear about a question:** Repeat it.
*   **If noise or distortion is detected:** Say: "I'm having trouble hearing you clearly. Please check your audio and try again."
## End of Session:
*   Politely conclude with: "Thank you for your time today. It was great speaking with you. Have a wonderful day! Please click 'End'." """


def extract_scenario_title(scenario_text):
    """
    Extract the title from scenario text.
    Looks for pattern: "Title: [title text]"
    Returns the title or None if not found.
    """
    if not scenario_text:
        return None
    
    # Pattern to match "Title: [title text]" - matches the actual format from Gemini
    pattern = r"Title:\s*(.+?)(?:\n|$)"
    match = re.search(pattern, scenario_text, re.IGNORECASE | re.MULTILINE)
    
    if match:
        title = match.group(1).strip()
        # Remove any brackets if present
        title = re.sub(r'^\[|\]$', '', title)
        return title
    
    return None


def extract_scenario_description(scenario_text):
    """
    Extract the description from scenario text.
    Looks for pattern: "Description: [description text]"
    Returns the description or None if not found.
    """
    if not scenario_text:
        return None
    
    # Pattern to match "Description: [description text]" - matches the actual format from Gemini
    pattern = r"Description:\s*(.+?)(?:\n|$)"
    match = re.search(pattern, scenario_text, re.IGNORECASE | re.MULTILINE)
    
    if match:
        description = match.group(1).strip()
        # Remove any brackets if present
        description = re.sub(r'^\[|\]$', '', description)
        return description
    
    return None


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



@api_view(["POST"])
@renderer_classes([JSONRenderer])
def save_transcript(request):
    """
    Capture transcript messages per username.
    - First POST: creates transcript
    - Subsequent POSTs: append messages
    """
    username = request.data.get("username")
    message = request.data.get("message")

    if not username or not message:
        return Response({"error": "username and message are required"},
                        status=status.HTTP_400_BAD_REQUEST)

    # Check if transcript exists
    transcript, created = Transcript.objects.get_or_create(user_name=username)

    # Append or create
    transcript.add_message(message)

    serializer = TranscriptSerializer(transcript)
    return Response({
        "created": created,
        "transcript": serializer.data
    }, status=status.HTTP_200_OK)





evaluation_prompt = """
You are an AI Evaluator for "Naukri Campus Conversify." Your primary function is to critically assess a student's performance in a given role-play scenario and provide structured feedback.

Here are the inputs for your evaluation:


Full Role-play Transcript (AI vs. Student):

{transcript}


Based on these inputs, perform the following evaluation:

Analyze the student's performance specifically against the context of the transcript.

Strengths (JSON strengths array): Identify concrete strengths demonstrated by the student. Provide specific examples or refer to moments in the transcript where possible.

Areas of Improvement (JSON areas_of_improvement array): Pinpoint specific areas where the student could improve. Offer clear, constructive, and actionable suggestions.

XP Score (JSON xp field): Provide a numerical score out of 100. This score should be a highly critical judgment, as if you are evaluating a real-world investment with significant funds at stake.

High Score (80-100): Student demonstrated exceptional readiness, strong competence, effectively mitigated risks, presented a robust and reliable case, and inspired high confidence.

Medium Score (50-79): Student showed foundational understanding and some competence but had noticeable gaps in critical areas, missed opportunities to excel, or presented a less than fully convincing case.

Low Score (0-49): Student exhibited significant gaps, poor judgment, inability to address the core mission effectively, failed to inspire confidence, or potentially increased perceived risk.

Justify this score implicitly through the specific strengths and areas for improvement you identify.

Your output must be in the following JSON format ONLY:



    {{
  "strengths": [
    "Specific strength identified based on transcript. (Max 20 words)",
    "Another specific strength with examples if applicable. (Max 20 words)"
  ],
  "areas_of_improvement": [
    "Specific area for improvement with actionable advice. (Max 20 words)",
    "Another area for improvement, linking to skill gaps or missed opportunities. (Max 20 words)"
  ],
  "xp": [Score out of 100]
    }}
"""

def evaluate_transcript(user_name: str):
    """
    Call Gemini (or whichever LLM SDK is configured) to evaluate a transcript
    for Naukri Campus Conversify.
    Retrieves transcript from DB using get_messages_string(user_name),
    injects it into evaluation_prompt, and returns the evaluation response.
    """

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or genai is None:
        logger.error("Gemini API not configured or SDK missing.")
        return None

    try:
        transcript_obj = Transcript.objects.get(user_name=user_name)
        logger.info(f"Fetching transcript for user: {user_name}...")
        transcript = transcript_obj.get_messages_string()
        if not transcript:
            logger.error(f"No transcript found for user: {user_name}")
            return None

        # Prepare evaluation prompt
        final_prompt = evaluation_prompt.format(transcript=transcript)

        logger.info("Requesting evaluation from Gemini API...")
        genai.configure(api_key=api_key)

        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        model = genai.GenerativeModel(model_name)

        # Pass evaluation prompt instead of scenario_creator_prompt
        response = model.generate_content(final_prompt)
        text = (response.text or "").strip()

        logger.debug(f"Gemini evaluation raw response: {text[:300]}...")

        return text  # returning the raw evaluation JSON

    except Exception as e:
        logger.exception(f"Gemini evaluation call failed for {user_name}: {e}")
        return None


class EvaluateTranscriptView(APIView):
    """
    API endpoint to evaluate a user's transcript and store results in DB.
    """
    renderer_classes = [JSONRenderer]
    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        if not username:
            return Response({"error": "username is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Step 1: Evaluate transcript
            evaluation_text = evaluate_transcript(username)
            if not evaluation_text:
                return Response(
                    {"error": "Evaluation failed or transcript missing"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Step 2: Try to clean and parse JSON
            result = None
            try:
                # remove markdown json fences like ```json ... ```
                cleaned = re.sub(r"^```json\s*|\s*```$", "", evaluation_text.strip(), flags=re.MULTILINE | re.DOTALL)
                result = json.loads(cleaned)
            except Exception as e:
                logger.warning(f"Failed to parse evaluation JSON, storing raw. Error: {e}")
                result = {"raw": evaluation_text}

            # Step 3: Save entire evaluation JSON
            evaluation = Evaluation.objects.create(
                user_name=username,
                evaluation=result
            )

            return Response({
                "message": "Evaluation saved successfully",
                "evaluation_id": evaluation.id,
                "evaluation": result
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.exception(f"Error evaluating transcript for {username}: {e}")
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



fake = Faker("en_IN")

@api_view(["GET"])
@renderer_classes([JSONRenderer])
def get_user(request):
    # Generate a realistic unique name every time
    name = fake.name()
    return Response({"user_name": name})


