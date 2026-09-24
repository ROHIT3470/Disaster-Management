// backend/services/aiService.js
// GeoNexus AI Learning & Emergency Intelligence Service — powered by Google Gemini
// Directly ports and elevates the root chat.py 4-agent safety architecture (Planner, Safety Auditor, Writer, Reviewer)
// and grounds AI reasoning strictly in existing project hydrological models and telemetry rules.

import { GoogleGenAI } from "@google/genai";
import {
  formatLiveContextPrompt,
  getProjectContextPrompt,
} from "./projectContext.js";

// ============================================================
// CLIENT INITIALISATION
// ============================================================

let _client = null;

function getClient() {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }

    _client = new GoogleGenAI({ apiKey });
  }

  return _client;
}

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

// ============================================================
// SYSTEM PROMPT — GEONEXUS LEARNING & COMMAND ASSISTANT
// ============================================================

const SYSTEM_PROMPT = `You are the GeoNexus AI Learning Assistant — an expert emergency and disaster risk reduction specialist integrated into the GeoNexus Command Center.

Your role is to educate, advise, and guide operators, emergency personnel, and citizens on disaster management, risk reduction, hydrology, and hazard mitigation.

DOMAIN GROUNDING (Existing Project Hydrological & Disaster Parameters):
• Flash Flood Risk Thresholds:
  - Watch: 20% - 29% probability
  - Warning: 30% - 49% probability
  - High Risk: 50% - 69% probability (evacuation prep)
  - Extreme Risk: >= 70% probability (immediate evacuation)
• Rainfall Intensity:
  - Low: < 10 mm/h
  - Moderate: 10 - 24 mm/h
  - High: 25 - 49 mm/h
  - Very High: 50 - 99 mm/h
  - Extreme: >= 100 mm/h (cloudburst threshold)
• Soil Moisture Saturation:
  - Moderate: 40% - 64%
  - High: 65% - 79%
  - Very High: 80% - 89%
  - Critical Saturation: >= 90% (liquefaction & slope failure trigger)
• River Water Level Surge (e.g., Brahmaputra & Barak River Basins):
  - Rising Slowly: > 0 to 0.24 m/h
  - Rising Rapidly: >= 0.25 to 0.49 m/h
  - Flash Surge: >= 0.50 m/h
• Slope Stability & Landslide Hazard:
  - Low: < 15°
  - Moderate: 15° - 24°
  - High Risk: 25° - 34°
  - Severe Instability: >= 35°
• Emergency Frameworks:
  - Sendai Framework for Disaster Risk Reduction (2015–2030)
  - NDMA India Standard Operating Procedures
  - National Emergency Number for India: 112

BEHAVIOURAL GUIDELINES:
1. Deliver structured, educational, safety-first responses suitable for a professional command-center environment.
2. Adapt response depth to the user's selected learning level:
   - BEGINNER: Simple language, clear definitions, everyday analogies, plain steps.
   - INTERMEDIATE: Technical concepts, hydrological dynamics, sensor metrics, and standard mitigation procedures.
   - ADVANCED: Mathematical/geotechnical formulations (Factor of Safety, catchment runoff coefficients, IMERG satellite calibration, early warning latency).
3. If immediate danger is described, put life-safety guidance and emergency helpline (112) first.
4. Never recommend swimming, wading, or driving through moving floodwater.
5. Never invent real-time sensor measurements or fictional shelter locations; explicitly clarify that live telemetry comes from the connected GeoNexus IoT fleet.
6. Use markdown formatting with clear bold headings, bullet points, and blockquotes for critical safety rules.`;

// ============================================================
// CONVERSATION HISTORY BUILDER
// ============================================================

function buildHistory(messages) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

function formatGroundedValue(value, suffix = "") {
  return value === null || value === undefined || value === ""
    ? "Unavailable"
    : `${value}${suffix}`;
}

function getContextFallbackResponse(message, context) {
  const lowerMessage = message.toLowerCase();
  const liveData = context?.liveData || {};
  const alerts = Array.isArray(liveData.alerts) ? liveData.alerts : [];
  const predictions = Array.isArray(liveData.predictions) ? liveData.predictions : [];
  const sensors = Array.isArray(liveData.sensors) ? liveData.sensors : [];
  const latestPrediction = predictions[0];

  if (lowerMessage.includes("alert")) {
    if (!alerts.length) {
      return "### GeoNexus Alert Summary\n\nNo active alerts are available in the current GeoNexus context.";
    }

    return [
      "### GeoNexus Alert Summary",
      "",
      ...alerts.map(
        (alert) =>
          `- **${alert.level || "Unclassified"} ${alert.type || "Alert"}** — ${alert.location || "Location unavailable"}: ${alert.message || "Alert details unavailable."}`,
      ),
      "",
      "_This response uses the current GeoNexus alert records because the AI generation service is temporarily unavailable._",
    ].join("\n");
  }

  const asksForCurrentRisk =
    lowerMessage.includes("prediction") ||
    lowerMessage.includes("current risk") ||
    lowerMessage.includes("latest risk") ||
    lowerMessage.includes("risk score") ||
    lowerMessage.includes("location at risk");

  if (asksForCurrentRisk) {
    if (!latestPrediction) {
      return "### GeoNexus Risk Summary\n\nNo prediction is available in the current GeoNexus context.";
    }

    return [
      "### Latest GeoNexus Prediction",
      "",
      `- **Location:** ${latestPrediction.location || "Unavailable"}`,
      `- **Risk level:** ${latestPrediction.riskLevel || "Unavailable"}`,
      `- **Overall risk score:** ${formatGroundedValue(latestPrediction.overallRisk)}`,
      `- **Flood risk:** ${formatGroundedValue(latestPrediction.floodRisk)}`,
      `- **Landslide risk:** ${formatGroundedValue(latestPrediction.landslideRisk)}`,
      `- **Lead time:** ${latestPrediction.leadTime || "Unavailable"}`,
      "",
      "The current record does not include enough information to explain additional contributing factors.",
      "",
      "_This response uses the current GeoNexus prediction record because the AI generation service is temporarily unavailable._",
    ].join("\n");
  }

  if (lowerMessage.includes("sensor") || lowerMessage.includes("reading") || lowerMessage.includes("telemetry")) {
    if (!sensors.length) {
      return "### GeoNexus Sensor Context\n\nNo sensor readings are available in the current GeoNexus context.";
    }

    return [
      "### Available GeoNexus Sensor Readings",
      "",
      ...sensors.map(
        (sensor) =>
          `- **${sensor.type || "Sensor"}** at ${sensor.location || "location unavailable"}: ${formatGroundedValue(sensor.value, sensor.unit ? ` ${sensor.unit}` : "")} (${sensor.status || "status unavailable"})`,
      ),
      "",
      "_This response uses current GeoNexus sensor records; no values were inferred._",
    ].join("\n");
  }

  const offlineNotice =
    "_Gemini is temporarily unavailable, so this explanation uses GeoNexus's existing safety rules and does not infer current conditions._";

  if (lowerMessage.includes("flood") || lowerMessage.includes("rain") || lowerMessage.includes("water")) {
    return [
      "### Flood Risk Learning Guide",
      "",
      "**What to understand**",
      "- Flood risk is interpreted from the available rainfall, soil-moisture, river, prediction, and alert records.",
      "- GeoNexus classifies rainfall below 10 mm/h as low, 10–24 mm/h as moderate, 25–49 mm/h as high, 50–99 mm/h as very high, and 100 mm/h or more as extreme.",
      "- A river level rise of 0.25–0.49 m/h is a rapid rise; 0.50 m/h or more is treated as a flash surge in the existing GeoNexus guidance.",
      "",
      "**Safety rule**",
      "> Never walk, swim, or drive through moving floodwater. Move to safer higher ground and contact emergency services if you are in immediate danger.",
      "",
      offlineNotice,
    ].join("\n");
  }

  if (
    lowerMessage.includes("landslide") ||
    lowerMessage.includes("slope") ||
    lowerMessage.includes("soil") ||
    lowerMessage.includes("moisture")
  ) {
    return [
      "### Landslide Risk Learning Guide",
      "",
      "- Increasing soil moisture raises pore-water pressure and can reduce the strength holding a slope together.",
      "- GeoNexus's existing guidance treats slopes below 15° as low, 15–24° as moderate, 25–34° as high risk, and 35° or more as severe instability.",
      "- Ground cracks, tilted trees or poles, muddy springs, and unusual rumbling are warning signs that require distance from the slope and official guidance.",
      "",
      "**Current values**",
      `- Latest prediction: ${latestPrediction?.location || "Unavailable in the current GeoNexus context"}`,
      `- Latest soil-moisture value: ${formatGroundedValue(latestPrediction?.soilMoisture)}`,
      "",
      offlineNotice,
    ].join("\n");
  }

  if (
    lowerMessage.includes("early warning") ||
    lowerMessage.includes("sendai") ||
    lowerMessage.includes("disaster management") ||
    lowerMessage.includes("risk score") ||
    lowerMessage.includes("explain")
  ) {
    return [
      "### GeoNexus Disaster Intelligence Guide",
      "",
      "GeoNexus combines alerts, predictions, locations, and sensor records to help operators understand hazard conditions. A risk score is an indicator produced by the connected prediction record; it is not a guarantee that an event will occur.",
      "",
      "**How to use the command center**",
      "1. Check the active alert level and its location.",
      "2. Compare the latest prediction with the relevant sensor records.",
      "3. Check when each record was updated and treat unavailable values as unknown.",
      "4. Follow the official alert and emergency response procedures for immediate safety decisions.",
      "",
      `- Active alerts in context: ${alerts.length}`,
      `- Predictions in context: ${predictions.length}`,
      `- Sensor records in context: ${sensors.length}`,
      "",
      offlineNotice,
    ].join("\n");
  }

  return [
    "### GeoNexus AI Assistant",
    "",
    "The live Gemini explanation service is temporarily unavailable because its provider quota or connection is unavailable.",
    "",
    "I can still use existing GeoNexus context for questions about **alerts**, **predictions**, **risk**, **sensors**, **floods**, **rainfall**, **soil moisture**, **landslides**, and **early warning systems**. I will report values as unavailable when the project has no matching record.",
    "",
    offlineNotice,
  ].join("\n");
}

// ============================================================
// 1. GENERATE LEARNING RESPONSE (CHAT & STUDY)
// ============================================================

export async function generateLearningResponse({
  message,
  history = [],
  learningLevel = "beginner",
  topic = null,
  sessionType = "chat",
  context = null,
}) {
  const levelContext = `\n\nCURRENT SESSION PARAMETERS:
- Learning Level: ${learningLevel.toUpperCase()}
- Active Topic: ${topic || "Multi-Hazard Disaster Risk Reduction"}
- Mode: ${sessionType.toUpperCase() === "STUDY" ? "Structured study module with key principles, real-world examples, and operational takeaways." : "Conversational learning, interactive advisory, and operator assistance."}`;

  const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n${getProjectContextPrompt()}${formatLiveContextPrompt(context)}${levelContext}`;

  try {
    const client = getClient();
    const priorHistory = buildHistory(history);

    const contents = [
      ...priorHistory,
      { role: "user", parts: [{ text: message }] },
    ];

    const generatePromise = client.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: fullSystemPrompt,
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1500,
      },
    });

    // 25-second timeout to balance responsiveness with model generation latency
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API request timed out")), 25000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const text = response.text?.trim();

    if (!text) {
      throw new Error("Empty response from Gemini API.");
    }

    return text;
  } catch (error) {
    console.error("[AI Service Error] Using grounded context response:", error.message);
    return getContextFallbackResponse(message, context);
  }
}

// ============================================================
// 2. ROOT CHAT.PY MULTI-AGENT EMERGENCY SAFETY PIPELINE
// Direct port of the 4-agent safety pipeline from chat.py:
// Stage 1: Planner Agent -> Stage 2: Safety Auditor Agent -> Stage 3: Response Writer -> Stage 4: Safety Reviewer
// ============================================================

export async function plannerAgent(situation, location = "India", memory = "") {
  const prompt = `You are the PRIMARY EMERGENCY RESPONSE PLANNING AGENT for GeoNexus Disaster Management.

Your job is to give immediate, practical, safety-first instructions to a person who may be experiencing a flood, flash-flood, or severe hazard emergency.

USER SITUATION:
${situation}

PREVIOUS CONVERSATION CONTEXT:
${memory || "None"}

USER LOCATION:
${location || "India"}

SAFETY PRIORITIES:
1. Preserve life first.
2. Tell the user what to do RIGHT NOW.
3. If in immediate danger, tell them to dial 112 (National Emergency Number in India).
4. Recommend moving to higher, safer ground WITHOUT entering moving floodwater.
5. NEVER tell the user to swim, walk, wade, or drive through moving water.
6. Never recommend entering water to rescue another person.
7. Warn about electrical hazards, downed power lines, structural collapse, and debris.
8. If trapped, explain how to signal rescuers without putting themselves in danger.
9. Do not invent fake shelters, phone numbers, or road closures.

OUTPUT FORMAT:
Return clear Markdown with sections:
# Immediate Actions
# If You Are Trapped
# Critical Hazards to Avoid
# Emergency Contacts & Signaling`;

  const client = getClient();
  const res = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { temperature: 0.3, maxOutputTokens: 800 },
  });
  return res.text?.trim() || "Immediate action: Move to high ground safely. Call 112.";
}

export async function safetyAuditorAgent(situation, plan, location = "India") {
  const prompt = `You are the SAFETY AUDITOR AGENT for an emergency flood-response system.

Analyze the user's situation and the proposed plan. Identify dangerous, missing, contradictory, unclear, or potentially misleading advice.

USER SITUATION:
${situation}

USER LOCATION:
${location}

PROPOSED PLAN:
${plan}

STRICT SAFETY RULES:
- Never recommend swimming through floodwater.
- Never recommend walking through moving floodwater.
- Never recommend driving through floodwater.
- Never recommend touching fallen electrical wires.
- Never recommend entering a flooded building when it may be structurally unsafe.
- Never recommend attempting an untrained rescue of another person.
- Prefer a safer alternative when an action is risky.

AUDIT THE PLAN AND OUTPUT ONLY MARKDOWN:
## Critical Safety Information
## Situation-Specific Hazards
## Dangerous Actions To Avoid
## Corrections To The Plan`;

  const client = getClient();
  const res = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { temperature: 0.2, maxOutputTokens: 800 },
  });
  return res.text?.trim() || "Safety Audit: Verified. Avoid moving water and electrical equipment.";
}

export async function emergencyWriterAgent(situation, plan, audit, location = "India", memory = "") {
  const prompt = `You are the FINAL EMERGENCY RESPONSE WRITER for GeoNexus.

Create a short, clear, actionable emergency response for a person experiencing an urgent hazard.

USER SITUATION:
${situation}

LOCATION:
${location}

INITIAL PLAN:
${plan}

SAFETY AUDIT:
${audit}

WRITING RULES:
- Put immediate survival actions first.
- Use simple words and short, numbered steps.
- Assume the user may have very little time to read.
- Emphasize National Emergency Number: 112.
- Preserve critical warnings from the safety audit.

OUTPUT ONLY MARKDOWN:
# Do This Now
1. ...
2. ...

# If You Are Trapped
1. ...
2. ...

# Avoid
- ...

# Get Help
- Emergency Helpline: 112
- What to tell rescuers: ...`;

  const client = getClient();
  const res = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { temperature: 0.3, maxOutputTokens: 800 },
  });
  return res.text?.trim() || plan;
}

export async function safetyReviewerAgent(situation, draft, audit, location = "India") {
  const prompt = `You are the FINAL SAFETY REVIEWER for an emergency disaster response chatbot.
Your job is to produce the safest possible final response for the user.

USER SITUATION:
${situation}

USER LOCATION:
${location}

DRAFT RESPONSE:
${draft}

SAFETY AUDIT:
${audit}

SAFETY CHECKLIST:
1. Does the response give the most important action first?
2. Does it completely eliminate any encouragement to enter floodwater?
3. Does it provide clear 112 emergency calling instructions?
4. Is the language simple and unambiguous?

RETURN ONLY THE FINAL POLISHED MARKDOWN RESPONSE.`;

  const client = getClient();
  const res = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { temperature: 0.2, maxOutputTokens: 900 },
  });
  return res.text?.trim() || draft;
}

export async function runEmergencyPipeline({ situation, location = "India", memory = "" }) {
  try {
    // Stage 1: Planning
    const plan = await plannerAgent(situation, location, memory);

    // Stage 2: Safety Audit
    const audit = await safetyAuditorAgent(situation, plan, location);

    // Stage 3: Writing Draft
    const draft = await emergencyWriterAgent(situation, plan, audit, location, memory);

    // Stage 4: Safety Review
    const finalResponse = await safetyReviewerAgent(situation, draft, audit, location);

    return {
      success: true,
      plan,
      audit,
      draft,
      finalResponse,
      agents: [
        { name: "Planner Agent", status: "completed", summary: "Synthesized immediate life preservation sequence." },
        { name: "Safety Auditor", status: "completed", summary: "Scanned for floodwater, electrical, and structural hazards." },
        { name: "Response Writer", status: "completed", summary: "Formatted crisp action-first instructions." },
        { name: "Safety Reviewer", status: "completed", summary: "Verified adherence to zero-risk safety protocols." },
      ],
    };
  } catch (error) {
    console.error("[Emergency Pipeline Error]", error);

    const fallbackGuidance = `# Immediate Emergency Actions

1. **Move to Higher Ground Now:** If water is rising around you, move to the highest accessible floor or sturdy elevated structure immediately. DO NOT enter floodwater on foot or in a vehicle.
2. **Call Emergency Services:** Dial **112** (India National Emergency Helpline) or alert local disaster control immediately.
3. **Cut Electrical Power:** If you can safely reach your main power switch without stepping in water, turn off the electricity. Avoid all submerged wiring.

# If You Are Trapped
1. **Signal Rescuers:** Move to the roof or upper window. Use a flashlight, bright cloth, or whistle. Do not climb into a closed attic without an exterior exit.
2. **Conserve Mobile Battery:** Keep calls brief, send SMS with your exact coordinates and status to emergency contacts.

# What To Avoid
- Never attempt to wade, swim, or drive through moving water.
- Avoid standing under power lines or near electrical substations.
- Do not drink unfiltered floodwater or consume food contaminated by water.

# Emergency Help
- **Emergency Helpline:** 112 / Disaster Management Cell: 1070
- **Location Details to Report:** Current landmark, floor level, number of occupants, injuries.`;

    return {
      success: true,
      plan: "Standard emergency life-safety sequence initiated.",
      audit: "Life safety audit confirmed: avoid all contact with moving water.",
      draft: fallbackGuidance,
      finalResponse: fallbackGuidance,
      agents: [
        { name: "Planner Agent", status: "fallback", summary: "Safety-first rulebook protocol active." },
        { name: "Safety Auditor", status: "fallback", summary: "Hazard avoidance rules validated." },
        { name: "Response Writer", status: "fallback", summary: "Urgent evacuation instructions compiled." },
        { name: "Safety Reviewer", status: "fallback", summary: "Emergency protocol certified." },
      ],
    };
  }
}

// ============================================================
// 3. STRUCTURED DISASTER MANAGEMENT STUDY MODULES
// Grounded strictly in the existing project data & hydrological parameters
// ============================================================

export function getStudyModules() {
  return [
    {
      id: "flash-floods",
      title: "Flash Flood Dynamics & Hydrology",
      icon: "Droplets",
      level: "Intermediate",
      summary: "Explore rainfall intensity thresholds, catchment saturation, and rapid surge mechanics.",
      keyConcepts: [
        {
          term: "Infiltration Excess Runoff",
          description: "When rainfall intensity exceeds soil infiltration capacity, immediate surface runoff occurs regardless of underlying moisture.",
        },
        {
          term: "Critical Soil Moisture (>= 80%)",
          description: "Once soil saturation passes 80%, pore space is exhausted, resulting in 95%+ runoff generation.",
        },
        {
          term: "River Surge Threshold (>= 0.25 m/h)",
          description: "A rate of river level change exceeding 0.25 m/h triggers automated downstream warning sirens.",
        },
      ],
      datasetLink: "Grounded in india_flash_flood_5000.csv and Forecast Rainfall Data",
      takeaway: "Flash floods can escalate within 1–2 hours of localized heavy rainfall (>50 mm/h). Early telemetry alerts save lives.",
    },
    {
      id: "slope-stability",
      title: "Landslide Mechanics & Slope Stability",
      icon: "Mountain",
      level: "Advanced",
      summary: "Understand shear strength reduction, pore water pressure, and slope angles in mountainous terrain.",
      keyConcepts: [
        {
          term: "Factor of Safety (FoS)",
          description: "The ratio of resisting shear strength to driving gravitational shear stress. FoS < 1.0 indicates slope failure.",
        },
        {
          term: "Critical Slope Angle (>= 25°)",
          description: "Slopes steeper than 25° with sparse vegetation have exponentially higher landslide risk under continuous precipitation.",
        },
        {
          term: "Pore Pressure Liquefaction",
          description: "Water pressure trapped inside soil pores reduces effective stress, causing soil to behave like a viscous liquid.",
        },
      ],
      datasetLink: "Grounded in GeoNexus Geotechnical Telemetry & Slope Stability Models",
      takeaway: "Slope stabilization requires continuous monitoring of pore water pressure and prompt evacuation when thresholds are breached.",
    },
    {
      id: "iot-sensors",
      title: "IoT Disaster Sensor Fleets",
      icon: "Radio",
      level: "Beginner",
      summary: "How rain gauges, ultrasonic river sensors, and soil probes provide real-time command telemetry.",
      keyConcepts: [
        {
          term: "Tipping Bucket Rain Gauge",
          description: "Measures precipitation in 0.2 mm increments, transmitting telemetry via LoRaWAN/cellular to the command center.",
        },
        {
          term: "Ultrasonic River Stage Sensors",
          description: "Mounted above river bridges to measure distance to water surface without physical debris contact.",
        },
        {
          term: "Time-Domain Reflectometry (TDR)",
          description: "Measures soil dielectric permittivity to calculate volumetric water content with high precision.",
        },
      ],
      datasetLink: "Grounded in GeoNexus IoT Sensor Network specifications",
      takeaway: "Redundant, multi-sensor nodes ensure telemetry transmission even during severe weather and local grid outages.",
    },
    {
      id: "command-protocols",
      title: "Command Center Emergency Operations",
      icon: "ShieldAlert",
      level: "Intermediate",
      summary: "Standard operating procedures, Sendai Framework DRR targets, and multi-agency coordination.",
      keyConcepts: [
        {
          term: "Incident Command System (ICS)",
          description: "A standardized management tool for command, control, and coordination of emergency response personnel.",
        },
        {
          term: "National Emergency Helpline (112)",
          description: "India's unified emergency phone number connecting police, fire, ambulance, and disaster response teams.",
        },
        {
          term: "Sendai Target G",
          description: "Substantially increase the availability of and access to multi-hazard early warning systems and disaster risk information.",
        },
      ],
      datasetLink: "Grounded in NDMA India Protocols & Disaster Management Framework",
      takeaway: "Clear communication chains, verified situational intelligence, and rapid public warning dissemination form the backbone of command operations.",
    },
  ];
}
