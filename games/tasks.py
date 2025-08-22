import os
import json
import logging
from celery import shared_task
from .models import VibeSession

try:
    import google.generativeai as genai
except Exception:
    genai = None

logger = logging.getLogger(__name__)
DEFAULT_COUNT = 10


vibe_question_prompt = """
You are a question generator for a game called "Vibe Check" on Naukri Campus.

🎯 Overall Goal:
Generate 10 *distinct, varied, and refreshing* 'Vibe Check' questions. Ensure no question is repeated within the same set of 10 questions.

👥 Target Audience and Context:
- Audience: 'Naukri Campus' users – college students, recent grads, early career professionals.
- Scenarios must cover a diverse range of topics, including but not limited to:
  academic projects, campus events, skill development, internship choices, job search strategies,
  team collaboration, professional ethics, work-life balance, career aspirations, leadership styles,
  learning methodologies, feedback preferences, digital communication habits, adapting to change,
  handling setbacks, networking approaches, and personal growth mindsets.
- ❌ Avoid: Inappropriate content, questions that are overly personal, political, or require factual answers rather than a preference or approach.

📝 Question Specifications:
- Each question must describe a relevant scenario, dilemma, or preference.
- Be concise, direct, engaging, and end with a question mark.
- Length: 10–15 words.
- **Crucially, ensure each set of 10 questions is unique and fresh, avoiding repetition from previous runs and within the current set.**

⚖️ Option Specifications:
- Each question must have exactly two contrasting options.
- Options should highlight different styles, priorities, or approaches (e.g., proactive vs. reflective, individual vs. team, stability vs. growth, planning vs. spontaneity, social vs. solitary, practical vs. theoretical, risk-taking vs. cautious, impact vs. recognition, process vs. outcome).
- Each option must be 10–15 words.

📦 Output Formatting:
- Format:  
  Q#. [Question text]?  
  [First option]  
  [Second option]
- Each option on a new line.
- NO intro/outro text; just the 10 questions in the specified format.

📌 Illustrative Examples:

Q1. To learn a new skill for your career, you prefer?  
Structured online courses with clear modules  
Experimenting on your own with practical projects

Q3. A project deadline is tight. You're asked for extra hours. Your response?  
Dive in and work extra to finish the task  
Prioritize personal time, manage workload better

Q4. You have two internship offers. Which one do you choose?  
Big, established company with clear career paths  
Small, rapidly growing startup with diverse roles

👉 Now, generate the 10 questions in the exact same format.
"""

import os
import json
import logging
import re
from celery import shared_task
from .models import VibeSession

try:
    import google.generativeai as genai
except Exception:
    genai = None

logger = logging.getLogger(__name__)
DEFAULT_COUNT = 10

def parse_gemini_text_to_sets(text):
    lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
    sets = []
    i = 0

    while i < len(lines):
        match = re.match(r"^Q(\d+)\.\s*(.+\?)$", lines[i])
        if match and i + 2 < len(lines):
            qid = int(match.group(1))
            question = match.group(2)
            answer1 = lines[i + 1]
            answer2 = lines[i + 2]

            sets.append({
                "id": qid,
                "question": question,
                "answers": [
                    {"text": answer1},
                    {"text": answer2}
                ]
            })
            i += 3
        else:
            i += 1  # Skip malformed or extra lines

    return sets


def fallback_sets(count):
    logger.warning("Using fallback vibe sets (Gemini not available).")
    return [
        {
            "id": i,
            "question": f"Vibe check: what's your move on late-night snacks?",
            "answers": [
                {"text": "Midnight maggi, always!"},
                {"text": "Sleep over snacks, any day."}
            ]
        }
        for i in range(1, count + 1)
    ]


def gemini_sets(count):
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or genai is None:
        logger.error("Gemini API not configured or SDK missing.")
        return None

    try:
        logger.info("Requesting vibe sets from Gemini API...")
        genai.configure(api_key=api_key)

        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        model = genai.GenerativeModel(model_name)

        response = model.generate_content(vibe_question_prompt)
        text = (response.text or "").strip()

        logger.debug(f"Gemini raw response: {text[:300]}...")

        sets = parse_gemini_text_to_sets(text)[:count]
        logger.info(f"Gemini returned {len(sets)} vibe sets.")
        return sets

    except Exception as e:
        logger.exception(f"Gemini call failed: {e}")
        return None



@shared_task
def generate_vibe_sets():
    logger.info("Starting vibe set generation task (no topic)...")
    sets = gemini_sets(DEFAULT_COUNT) or fallback_sets(DEFAULT_COUNT)

    session = VibeSession.objects.create(topic="general", sets_json={"sets": sets})
    logger.info(f"Stored VibeSession ID={session.id} with {len(sets)} sets.")
    print(f"[CELERY TASK] Generated and stored {len(sets)} vibe sets (Session ID={session.id})")

    return f"Generated and stored new vibe sets (Session ID={session.id})"
