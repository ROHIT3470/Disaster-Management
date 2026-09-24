import os
from fastapi import FastAPI
from env_config import load_project_environment
from google import genai
from fastapi import FastAPI, UploadFile, File, Header
from fastapi.responses import FileResponse
from pymongo import MongoClient
app = FastAPI()

load_project_environment()
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError(
        "GEMINI_API_KEY is missing. Add it to my_project/.env or configure "
        "the environment before starting the project assistant."
    )

client = genai.Client(api_key=api_key)

mongo_uri = os.getenv("MONGODB_URI")
clint = MongoClient(mongo_uri) if mongo_uri else None

db = clint["AI"] if clint is not None else None
user_data = db["User"] if db is not None else None
memory_collection = db["Memories"] if db is not None else None


# Planner Agent
def planner(topic, location, memory):
    response = client.models.generate_content(
        model="models/gemini-3.6-flash",
        contents=f"""
You are the PRIMARY EMERGENCY RESPONSE PLANNING AGENT.

Your job is to give immediate, practical, safety-first instructions to a person
in India who may be experiencing a flood or flash-flood emergency.

The user may be frightened, injured, trapped, or unable to think clearly.
Therefore, prioritize short, direct instructions that can be acted on immediately.

USER SITUATION:
{topic}

previous conversetion as follow:
{memory}

USER LOCATION:
{location}

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



# Research Agent
def research(topic, plan, location):
    response = client.models.generate_content(
        model="models/gemini-3.6-flash",
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


# Writing Agent
def writing(topic, plan, research_data, location, memory):
    response = client.models.generate_content(
        model="models/gemini-3.6-flash",
        contents=f"""
You are the FINAL EMERGENCY RESPONSE WRITER.

Create a short, clear, actionable emergency response for a person in India
who may be experiencing a flood or flash flood.

The person may be frightened or in immediate danger. They need instructions,
not an article or educational explanation.

USER SITUATION:
{topic}

previous convetation:
{memory}

LOCATION:
{location}

INITIAL PLAN:
{plan}

SAFETY AUDIT:
{research_data}

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
- Do not call the response an "article".
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


# Review Agent
def review(topic, article,research_data,location):
    response = client.models.generate_content(
        model="models/gemini-3.6-flash",
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

# topic = input("Enter the topic: ")
# plan=planner(topic)
# research_data = research(topic,plan)
# article = writing(topic, research_data)
# improved_article = review(topic, article,research_data)
# print(improved_article)

# Writing Agent
def terminal_chat():
    print("\n====================================")
    print("   DISASTER EMERGENCY AI CHATBOT")
    print("====================================\n")

    topic = input("Enter your emergency/problem: ").strip()
    location = input("Enter your location: ").strip()

    memory_text = ""

    print("\nProcessing your request...")
    
    plan = planner(topic, location, memory_text)
    print("✓ Planning completed")

    research_data = research(topic, plan, location)
    print("✓ Research completed")

    article = writing(topic, plan, research_data, location, memory_text)
    print("✓ Response generated")

    improved_article = review(
        topic,
        article,
        research_data,
        location
    )
    print("✓ Response reviewed")

    print("\n====================================")
    print("             AI RESPONSE")
    print("====================================\n")

    print(improved_article)

if __name__ == "__main__":
    terminal_chat()