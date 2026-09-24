import os
from typing import TYPE_CHECKING, Any

from google import genai
from pymongo import MongoClient
from env_config import load_project_environment

if TYPE_CHECKING:
    try:
        from PIL import Image as PILImage  # type: ignore[import-not-found]
    except ImportError:
        class _PILImagePlaceholder:
            @staticmethod
            def open(*args, **kwargs):
                raise ImportError("Pillow is not installed.")

            @property
            def mode(self):
                raise ImportError("Pillow is not installed.")

            def convert(self, *args, **kwargs):
                raise ImportError("Pillow is not installed.")

        PILImage = _PILImagePlaceholder
else:
    try:
        from PIL import Image as PILImage  # type: ignore[import-not-found]
    except ImportError:
        class _PILImagePlaceholder:
            @staticmethod
            def open(*args, **kwargs):
                raise ImportError("Pillow is not installed.")

            @property
            def mode(self):
                raise ImportError("Pillow is not installed.")

            def convert(self, *args, **kwargs):
                raise ImportError("Pillow is not installed.")

        PILImage = _PILImagePlaceholder

ENV_FILE = load_project_environment()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    searched_files = ", ".join(
        str(path) for path in (
            ENV_FILE,
        ) if path
    ) or "my_project/.env and backend/.env"
    raise RuntimeError(
        "GEMINI_API_KEY is missing. Add it to my_project/.env or export it "
        f"before starting the terminal assistant. Checked: {searched_files}"
    )


# ============================================================
# CONFIGURATION
# ============================================================


# Gemini
client = genai.Client(
    api_key=GEMINI_API_KEY
)

# MongoDB
mongo_uri = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/disaster_management")
mongo_db_name = os.getenv("MONGO_DB_NAME", "disaster_management")
clint = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)

db = clint[mongo_db_name]

user_data = db["User"]
memory_collection = db["Memories"]

# Gemini model
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")


# ============================================================
# IMAGE ANALYSIS
# ============================================================

def analyze_image(image: Any, topic: str, location: str):

    response = client.models.generate_content(
        model=MODEL,
        contents=[
            """
You are a visual safety assessment assistant for an emergency
flood-response system.

Analyze the provided image carefully.

Identify only visible information that could help assess the user's
immediate safety.

Look for things such as:

- floodwater
- approximate visible water level
- fast-moving water
- people in danger
- vehicles surrounded by water
- damaged buildings
- collapsed structures
- electrical wires or electrical equipment
- blocked roads
- debris
- bridges
- possible landslide conditions
- safe elevated areas that are visibly accessible
- exits or escape routes that are visibly available

IMPORTANT:

- Do not guess information that cannot be seen.
- Do not claim the image provides real-time information.
- Do not identify an exact location from visual appearance.
- Clearly distinguish visible facts from uncertainty.
- Do not tell the user to enter floodwater.
- Do not recommend dangerous rescue actions.

USER SITUATION:
"""
            + topic
            + """

USER LOCATION:
"""
            + location
            + """

Return a concise visual safety assessment in Markdown.
""",
            image
        ]
    )

    return response.text


# ============================================================
# PLANNER AGENT
# ============================================================

def planner(topic, location, memory, visual_analysis):

    response = client.models.generate_content(
        model=MODEL,
        contents=f"""
You are the PRIMARY EMERGENCY RESPONSE PLANNING AGENT.

Your job is to give immediate, practical, safety-first instructions to a person
in India who may be experiencing a flood or flash-flood emergency.

The user may be frightened, injured, trapped, or unable to think clearly.
Therefore, prioritize short, direct instructions that can be acted on immediately.

USER SITUATION:
{topic}

PREVIOUS CONVERSATION:
{memory}

USER LOCATION:
{location}

VISUAL ANALYSIS:
{visual_analysis}

SAFETY PRIORITIES:

1. Preserve life first.
2. Tell the user what to do RIGHT NOW.
3. If they are in immediate danger, tell them to contact emergency services.
4. Recommend moving to higher, safer ground when it can be done WITHOUT
   entering dangerous floodwater.
5. NEVER tell the user to swim, walk, wade, or drive through moving floodwater.
6. Never recommend entering water to rescue another person.
7. Warn about:
   - fast-moving water
   - drowning
   - electrical wires and electrical equipment
   - unstable buildings and structures
   - sewage, chemicals, and contaminated water
   - debris and hidden holes
   - landslides where relevant
   - vehicles becoming trapped in water
8. If the user is already trapped or surrounded by water:
   - prioritize emergency communication
   - tell them to move to the safest elevated location available
   - tell them not to enter moving water
   - explain how to make themselves visible to rescuers
9. If the user is inside a vehicle surrounded by rising water, prioritize
   getting to a safe elevated location ONLY if it can be done without entering
   dangerous moving water.
10. Do not give advice that requires specialized rescue equipment or training.
11. Do not invent:
   - shelters
   - evacuation centers
   - rescue teams
   - road closures
   - weather conditions
   - flood depth
   - rescue availability
   - local authorities
   - phone numbers
12. For India, you may mention 112 as the national emergency number when
   emergency assistance is appropriate.
13. If the user's exact location is unknown or insufficient to give
   location-specific advice, say so rather than guessing.
14. Never claim to have real-time information unless it is explicitly provided
   in the user input.

RESPONSE RULES:

- Return ONLY Markdown.
- Do not begin with a long explanation.
- Put the most urgent action first.
- Use simple language.
- Keep sentences short.
- Use numbered steps for actions.
- Avoid unnecessary background information.
- Do not repeat the user's situation unnecessarily.
- Do not tell the user to "stay calm" instead of giving an action.
- If there is immediate danger, make that obvious.

OUTPUT FORMAT:

# Immediate Actions

1. ...
2. ...
3. ...

# If You Are Trapped

1. ...
2. ...
3. ...

# What To Avoid

- ...
- ...
- ...

# Emergency Help

- Emergency number: ...
- Tell rescuers: ...
- Your location should include: ...

Only include sections that are relevant, but always prioritize immediate
survival actions.
"""
    )

    return response.text


# ============================================================
# SAFETY AUDITOR
# ============================================================

def research(topic, plan, location, visual_analysis):

    response = client.models.generate_content(
        model=MODEL,
        contents=f"""
You are the SAFETY AUDITOR AGENT for an emergency flood-response system.

Your job is NOT to rewrite the entire plan.

Analyze the user's situation and the proposed plan. Identify dangerous,
missing, contradictory, unclear, or potentially misleading advice.

USER SITUATION:
{topic}

USER LOCATION:
{location}

PROPOSED PLAN:
{plan}

VISUAL ASSESSMENT:
{visual_analysis}

AUDIT THE PLAN FOR:

1. Immediate life-threatening risks.
2. Whether the first actions are actually the safest actions.
3. Dangerous advice involving floodwater.
4. Electrical hazards.
5. Vehicle-related hazards.
6. Building-collapse or structural hazards.
7. Contaminated water, sewage, chemicals, and debris.
8. Landslide risk where relevant.
9. Whether the advice changes depending on whether the user is:
   - outdoors
   - inside a building
   - inside a vehicle
   - trapped by rising water
   - injured
   - with children, elderly people, or someone with limited mobility
10. Whether emergency communication instructions are adequate.
11. Whether the plan makes unsupported assumptions about local conditions.
12. Whether any emergency phone number or local resource appears uncertain.
13. Whether any instruction could encourage the user to take unnecessary risks.

STRICT SAFETY RULES:

- Never recommend swimming through floodwater.
- Never recommend walking through moving floodwater.
- Never recommend driving through floodwater.
- Never recommend touching fallen electrical wires.
- Never recommend entering a flooded building when it may be structurally unsafe.
- Never recommend attempting a dangerous rescue of another person.
- Never invent local shelters, rescue services, weather, road conditions,
  evacuation orders, or other real-time information.
- Prefer a safer alternative when an action is risky.
- If information cannot be established from the provided inputs, explicitly
  mark it as "unknown" rather than guessing.

IMPORTANT:

Only identify information that would materially improve the person's safety.
Do not provide general flood education.
Do not repeat the entire plan.

OUTPUT ONLY MARKDOWN:

## Critical Safety Information

- ...

## Situation-Specific Guidance

- ...

## Dangerous Actions To Avoid

- ...

## Emergency Communication

- ...

## Corrections To The Plan

- ...
"""
    )

    return response.text


# ============================================================
# WRITING AGENT
# ============================================================

def writing(
    topic,
    plan,
    research_data,
    location,
    memory,
    visual_analysis
):

    response = client.models.generate_content(
        model=MODEL,
        contents=f"""
You are the FINAL EMERGENCY RESPONSE WRITER.

Create a short, clear, actionable emergency response for a person in India
who may be experiencing a flood or flash flood.

The person may be frightened or in immediate danger. They need instructions,
not an article or educational explanation.

USER SITUATION:
{topic}

PREVIOUS CONVERSATION:
{memory}

LOCATION:
{location}

INITIAL PLAN:
{plan}

SAFETY AUDIT:
{research_data}

VISUAL ASSESSMENT:
{visual_analysis}

WRITING RULES:

- Put immediate survival actions first.
- Use simple words and short sentences.
- Assume the user may have very little time to read.
- Use numbered steps for actions.
- Clearly distinguish what the user should do NOW from secondary advice.
- Never tell the user to swim, walk, wade, or drive through moving floodwater.
- Never encourage dangerous rescue attempts.
- Include emergency communication when appropriate.
- Mention 112 for emergency assistance in India when appropriate.
- Do not invent local shelters, rescue teams, road conditions, weather,
  evacuation orders, or other real-time information.
- Do not claim knowledge that was not provided.
- Do not repeat the same warning multiple times.
- Do not include a long introduction.
- Do not include irrelevant background information.
- Preserve important safety warnings from the safety audit.
- If the user is trapped, make trapped-person instructions prominent.
- If the situation is ambiguous, give the safest broadly applicable action
  instead of making assumptions.

OUTPUT ONLY MARKDOWN.

Use this structure:

# Do This Now

1. ...
2. ...
3. ...

# If You Are Trapped

1. ...
2. ...
3. ...

# Avoid

- ...
- ...
- ...

# Get Help

- Call: ...
- Tell rescuers: ...

Keep the final response concise and action-oriented.
"""
    )

    return response.text


# ============================================================
# FINAL REVIEW
# ============================================================

def review(
    topic,
    article,
    research_data,
    location,
    visual_analysis
):

    response = client.models.generate_content(
        model=MODEL,
        contents=f"""
You are the FINAL SAFETY REVIEWER for an emergency flood-response chatbot.

Your job is to produce the safest possible final response for the user.

USER SITUATION:
{topic}

USER LOCATION:
{location}

DRAFT RESPONSE:
{article}

SAFETY AUDIT:
{research_data}

VISUAL ASSESSMENT:
{visual_analysis}

BEFORE RETURNING THE RESPONSE, CHECK:

1. Does the response give the most important action first?
2. Could any instruction put the user in greater danger?
3. Does it accidentally encourage:
   - swimming in floodwater?
   - walking through moving water?
   - driving through floodwater?
   - touching electrical wires or equipment?
   - entering an unstable flooded building?
   - dangerous rescue attempts?
4. Does it adequately address the possibility of being trapped?
5. Does it provide useful emergency communication instructions?
6. Does it avoid inventing local information?
7. Does it avoid unsupported claims about weather, flooding, roads,
   shelters, rescue teams, or authorities?
8. Is the language simple enough for a frightened person?
9. Is anything important missing?
10. Is there unnecessary information that could distract from urgent actions?
11. Is emergency number information accurate and appropriately qualified?
12. Are the instructions consistent with the user's actual situation?

SAFETY RULE:

When there is a conflict between being informative and being safe,
choose the safer response.

IMPORTANT:

- Do not add facts that are not supported by the user input or safety audit.
- Do not invent location-specific information.
- Do not make the response longer just for completeness.
- Remove unsafe instructions rather than explaining why they are unsafe.
- Preserve critical emergency instructions.
- Do not mention that you are an AI, agent, reviewer, or language model.

RETURN ONLY THE FINAL MARKDOWN RESPONSE.

The final response should:

- start with the most urgent action
- use short numbered steps
- contain only information useful to immediate survival
- be concise
"""
    )

    return response.text


# ============================================================
# GET USER FROM MONGODB
# ============================================================

def get_user(token):

    user = user_data.find_one({
        "token": token
    })

    return user


# ============================================================
# GET PREVIOUS MEMORY
# ============================================================

def get_memory(user_id):

    previous_memory = memory_collection.find({
        "User_id": user_id
    })

    memory_text = ""

    for item in previous_memory:

        memory_text += f"""
User: {item.get('question', '')}
Assistant: {item.get('answer', '')}
"""

    return memory_text


# ============================================================
# MAIN CHAT FUNCTION
# ============================================================

def chatbot(
    topic,
    location,
    user_id,
    image_path=None
):

    # --------------------------------------------------------
    # MEMORY
    # --------------------------------------------------------

    memory_text = get_memory(user_id)

    # --------------------------------------------------------
    # IMAGE
    # --------------------------------------------------------

    visual_analysis = "No image was provided."

    if image_path:

        allowed_extensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        ]

        extension = os.path.splitext(image_path)[1].lower()

        if extension not in allowed_extensions:

            print(
                "\nOnly JPG, JPEG, PNG and WEBP images are supported."
            )

            return None

        if not os.path.exists(image_path):

            print("\nImage file does not exist.")

            return None

        try:

            uploaded_image = PILImage.open(image_path)

            if uploaded_image.mode != "RGB":

                uploaded_image = uploaded_image.convert("RGB")

            print("\n[1/5] Analyzing image...")

            visual_analysis = analyze_image(
                uploaded_image,
                topic,
                location
            )

        except Exception as e:

            print("\nCould not analyze the image.")
            print("Error:", e)

            return None

    else:

        print("\n[1/5] No image provided.")

    # --------------------------------------------------------
    # PLANNER
    # --------------------------------------------------------

    print("[2/5] Creating emergency plan...")

    plan = planner(
        topic,
        location,
        memory_text,
        visual_analysis
    )

    # --------------------------------------------------------
    # SAFETY AUDIT
    # --------------------------------------------------------

    print("[3/5] Performing safety audit...")

    research_data = research(
        topic,
        plan,
        location,
        visual_analysis
    )

    # --------------------------------------------------------
    # WRITER
    # --------------------------------------------------------

    print("[4/5] Writing emergency response...")

    article = writing(
        topic,
        plan,
        research_data,
        location,
        memory_text,
        visual_analysis
    )

    # --------------------------------------------------------
    # FINAL REVIEW
    # --------------------------------------------------------

    print("[5/5] Performing final safety review...")

    improved_article = review(
        topic,
        article,
        research_data,
        location,
        visual_analysis
    )

    # --------------------------------------------------------
    # SAVE MEMORY
    # --------------------------------------------------------

    memory_collection.insert_one({
        "User_id": user_id,
        "question": topic,
        "answer": improved_article
    })

    return improved_article


# ============================================================
# TERMINAL APPLICATION
# ============================================================

def main():

    print("=" * 60)
    print("      FLOOD EMERGENCY RESPONSE SYSTEM")
    print("=" * 60)

    print("\nType 'exit' at any time to quit.")

    # --------------------------------------------------------
    # LOGIN
    # --------------------------------------------------------

    while True:

        token = input("\nEnter your token: ").strip()

        if token.lower() == "exit":
            print("Goodbye.")
            return

        user = get_user(token)

        if user:

            print("\nToken verified.")
            break

        print("\nInvalid Token. Please try again.")

    # --------------------------------------------------------
    # USER LOCATION
    # --------------------------------------------------------

    location = input("\nEnter your location: ").strip()

    if location.lower() == "exit":
        return

    # --------------------------------------------------------
    # CHAT LOOP
    # --------------------------------------------------------

    while True:

        print("\n" + "-" * 60)

        topic = input(
            "\nDescribe your emergency situation:> "
        ).strip()

        if topic.lower() == "exit":
            break

        if not topic:
            print("Please describe the situation.")
            continue

        # ----------------------------------------------------
        # OPTIONAL IMAGE
        # ----------------------------------------------------

        image_path = input(
            "\nImage path (optional - press ENTER to skip): > "
        ).strip()

        if image_path.lower() == "exit":
            break

        if image_path == "":
            image_path = None

        # ----------------------------------------------------
        # RUN AGENTS
        # ----------------------------------------------------

        try:

            result = chatbot(
                topic=topic,
                location=location,
                user_id=user["_id"],
                image_path=image_path
            )

            if result:

                print("\n")
                print("=" * 60)
                print("             EMERGENCY RESPONSE")
                print("=" * 60)

                print(result)

                print("=" * 60)

        except Exception as e:

            print("\nAn error occurred:")
            print(e)

    print("\nEmergency system closed.")


# ============================================================
# START PROGRAM
# ============================================================

if __name__ == "__main__":
    main()
