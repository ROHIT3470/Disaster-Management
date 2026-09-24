# GeoNexus Operator Manual

GeoNexus is an authenticated disaster-management command center for monitoring
hazards, reviewing predictions, coordinating response, and using the connected
AI learning and emergency tools.

This manual describes the features currently available in the application and
the safest way to operate them.

## 1. Start the system

### Required services

Run MongoDB first. Then start the backend and frontend in separate terminals:

```powershell
cd "D:\Disaster Management\backend"
npm install
npm run dev
```

```powershell
cd "D:\Disaster Management\frontend"
npm install
npm run dev
```

Open:

- Public application: http://localhost:5173/
- Login: http://localhost:5173/login
- Backend health check: http://localhost:5000/api/health

The backend `.env` must contain `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
`CLIENT_URL`, and `PORT`. AI functions additionally require `GEMINI_API_KEY`.
SMTP settings are required only for real password-reset email delivery.

## 2. Sign in and account access

1. Open `/login`.
2. Select **Command Sign In**.
3. Enter the operator email and password.
4. Select **Access Command Portal**.
5. To create a user, select **Create Account**, enter the full name, email,
   and a password of at least six characters, then select **Register Officer
   Account**.

Development demo accounts:

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@disaster.org` | `admin123` |
| Operator | `operator@disaster.org` | `operator123` |

Use the administrator account only for local development. Change seeded
credentials before any shared or production deployment.

### Password recovery

1. Select **Forgot password?** on the login form.
2. Submit the account email.
3. Open the reset link received by email.
4. Enter and confirm the new password.
5. Return to `/login` and sign in again.

When SMTP is not configured in development, the reset page may show a local
reset link for testing. Production uses a generic response and does not expose
whether an email address exists.

## 3. Command Dashboard

Route: `/dashboard`

The dashboard is the operational summary screen.

### Main workflow

1. Review the threat advisory banner at the top.
2. Check the counts for alerts, sensors, and fleet health.
3. Review the overall risk, flood risk, landslide risk, and lead-time cards.
4. Select **Review Active Alerts** when the advisory indicates elevated risk.
5. Use the refresh control to synchronize current backend records.
6. Use the navigation sidebar to move to a detailed module.

Treat empty or unavailable values as unknown. Do not interpret missing data as
safe conditions.

## 4. Live Monitoring

Route: `/dashboard/monitoring`

This screen displays the sensor fleet and telemetry records.

1. Review total nodes, online stations, and threshold warnings.
2. Search by location, sensor ID, or sensor type.
3. Filter by sensor type and status.
4. Select the refresh button to reload telemetry.
5. Use **Stream: STATIC** for normal backend polling.
6. Use the simulator only for UI/testing demonstrations. Simulated packets are
   not field observations and must never be used for an operational decision.

## 5. GIS Risk Map

Route: `/dashboard/risk-map`

1. Inspect the map markers and risk overlays.
2. Use the available layer/filter controls to focus on hazards or locations.
3. Select a marker to inspect location-level information.
4. Compare map information with the current dashboard prediction and alerts.

Map data is an operational aid. Confirm evacuation decisions through current
authoritative alerts and local emergency authorities.

## 6. Alerts and early warnings

Route: `/dashboard/alerts`

1. Review active warning cards first.
2. Sort or filter by severity, type, status, or location when available.
3. Open an alert to read its message, affected location, and expiry.
4. Use acknowledgement or status controls according to your organization’s
   response procedure.
5. Use the siren/test controls only in a controlled test or exercise.

Do not close or acknowledge an alert as resolved unless the responsible
operator has verified the situation.

## 7. AI Simulation Lab

Route: `/dashboard/simulation`

Use this page for what-if analysis and training:

1. Enter the scenario conditions.
2. Set rainfall, soil, slope, river, or hazard inputs offered by the form.
3. Run the simulation.
4. Review the predicted risk and contributing factors.
5. Compare scenarios rather than treating one simulation as a confirmed field
   forecast.

Simulation output is decision support, not a replacement for live telemetry,
official warnings, or trained incident command.

## 8. Historical Data

Route: `/dashboard/history`

1. Search or filter the incident archive.
2. Review event timelines and risk values.
3. Use charts to compare historical trends.
4. Export CSV/report data when the export control is available.

Historical and forecast files in `my_project` must not be described as current
conditions unless the application explicitly labels them as live telemetry.

## 9. Emergency Response Hub

Route: `/dashboard/emergency-hub`

### Helplines

1. Locate the appropriate response agency.
2. Select **Copy Emergency Number** or click the displayed number.
3. Dial the copied number through an approved phone channel.
4. For immediate danger in India, use **112** where applicable.

### Verified locations

Review published shelter or relief locations only when the panel says the data
is available. If it says no verified location is published, do not treat an
unverified place as an active shelter.

### Evacuation checklist

Select each completed checklist item. Typical preparation includes water,
food, identification, medication, radio, flashlight, first aid, and safe
electrical/gas shutdown before evacuation when it can be done safely.

## 10. AI Assistant and Learning Lab

Routes:

- `/dashboard/ai-assistant`
- `/dashboard/learning`

All AI routes require authentication.

### Chat & Learn

1. Open the AI Assistant.
2. Select **Chat & Learn**.
3. Choose **Beginner**, **Intermediate**, or **Advanced** instruction tier.
4. Ask a question or select a quick prompt.
5. Press Enter to send; use Shift+Enter for a new line.
6. Use the copy action on an assistant response.
7. Use the speaker action to read the latest assistant response aloud.
8. Use **New Session** to clear the conversation after confirming.

The assistant is grounded by the connected GeoNexus records when relevant. It
should report unavailable values rather than inventing live measurements.

### Emergency 4-Agent mode

1. Select **Emergency 4-Agent**.
2. Enter the location/geography.
3. Describe the incident and immediate threat conditions.
4. Confirm that the situation is real and current before running the protocol.
5. Select **Run 4-Agent Safety Protocol**.
6. Review the four expandable stages:
   - Primary Planning Agent
   - Safety Auditor
   - Safety Writer
   - Final Reviewer
7. Follow only verified, safety-first instructions and contact emergency
   services for immediate danger.

The pipeline is a decision-support tool. It cannot see the physical scene,
guarantee rescue availability, or replace emergency dispatch.

### Study Lab

1. Select **Study Lab**.
2. Choose a curriculum module.
3. Read the module explanation and threshold guidance.
4. Ask the AI to explain a module at the selected learning tier.

### Project AI status

The header can show connected dataset and Python-tool counts. This is an
integration-readiness indicator, not proof that a dataset contains live values.

### Visual responses

The response renderer supports:

- Markdown image links returned by the AI
- `visuals` or `images` response metadata
- Captions and source labels
- Live-visual badges when the backend explicitly marks an asset as live
- Open-full-image links
- A clear unavailable placeholder when a visual was requested but no asset was
  returned

The current `my_project` assistant supports uploaded-image analysis. It does
not currently provide a complete image-generation/live-photo API. The UI
therefore never fabricates a live image.

## 11. Administration

Route: `/dashboard/admin`

Administrator access is required.

Use the admin panel to:

1. Review system and data status.
2. Manage configured sensors or locations where controls are provided.
3. Review administrative records.
4. Use destructive actions only after verifying the target record and impact.

Operators without administrator privileges should use the monitoring, alerts,
map, simulation, history, emergency, and AI modules instead.

## 12. Theme and usability controls

- The application defaults to the light white/blue/green design.
- Theme preference is stored in browser local storage.
- Buttons are responsive and sized for touch use.
- On small screens, action buttons become full-width where appropriate.
- Use visible focus rings and keyboard navigation for accessible operation.
- If a page appears stale, reload after restarting the frontend dev server.

## 13. `my_project` data and tools

Directory: `my_project/`

Install Python dependencies:

```powershell
cd "D:\Disaster Management\my_project"
python -m pip install -r requirements.txt
```

### Emergency terminal assistant

```powershell
cd "D:\Disaster Management\my_project"
python chat_terminal.py
```

Configure `GEMINI_API_KEY` before use. Optional MongoDB memory uses `MONGO_URI`.
The terminal can analyze a supported local image (JPG, JPEG, PNG, or WEBP).
Never upload sensitive personal or location data unless your organization
permits it.

The tools automatically load the first available environment file from
`my_project/.env` and `backend/.env`. For a standalone Python setup:

```powershell
cd "D:\Disaster Management\my_project"
Copy-Item .env.example .env
notepad .env
python chat_terminal.py
```

Put the real `GEMINI_API_KEY` only in the local `.env` or PowerShell
environment. Do not commit it.

### NASA GPM downloader

```powershell
cd "D:\Disaster Management\my_project"
python download_files_GPM_3IMERGDF_07.py `
  --start 2025-08-31T00:00:00.000Z `
  --end 2025-09-30T23:59:59.000Z `
  --bbox 91.55,25.95,91.9,26.3 `
  --output-dir .\GPM_3IMERGDF_07 `
  --workers 5
```

NASA Earthdata credentials are required when the downloader is run. Downloaded
files are source data and should be validated before being used for analysis.

### Project files currently connected to the web app

- `india_flash_flood_5000.csv`
- `Assam river water level Forecast_2026_2030.csv`
- `GPM_3IMERGDF_07_regional.csv`
- `Forecast Rainfall Data.csv`
- `flash_flood_model.pkl`
- `chat_terminal.py`
- `download_files_GPM_3IMERGDF_07.py`

## 14. Safe operating rules

1. Treat live alerts and verified authorities as higher priority than AI text.
2. Never walk, swim, or drive through moving floodwater.
3. Never enter floodwater to rescue another person without trained capability
   and proper equipment.
4. Never infer safety from missing telemetry.
5. Never treat simulated, historical, or forecast data as current observation.
6. Confirm shelters, road status, responders, and phone numbers before
   communicating them as current.
7. For immediate danger, contact local emergency services; in India, 112 is the
   national emergency number.

## 15. Troubleshooting

| Symptom | Action |
|---|---|
| Login redirects back to login | Confirm backend is running, MongoDB is reachable, and credentials are valid. |
| Dashboard shows no data | Check `/api/health`, confirm the database is seeded, then refresh. |
| AI says unavailable | Confirm `GEMINI_API_KEY`, backend logs, and authenticated session. |
| Password email does not arrive | Configure SMTP App Password values and check spam. |
| AI history does not load | Confirm the JWT session is valid and MongoDB is available. |
| Map tiles do not appear | Check network access; the map requires external tile loading. |
| Python tool fails on import | Run `python -m pip install -r requirements.txt`. |

## 16. Verification commands for developers

```powershell
cd "D:\Disaster Management\frontend"
npm run build
```

```powershell
cd "D:\Disaster Management\backend"
npm test
```

```powershell
cd "D:\Disaster Management\my_project"
python -m py_compile chat_terminal.py download_files_GPM_3IMERGDF_07.py
```
