🏔️ Hill_Gaurd — AI + IoT + GIS Multi-Hazard Early Warning System
Sense → Fuse → Predict → Alert → Respond
Hill_Gaurd is an AI-powered, IoT-enabled, GIS-based disaster intelligence and early warning platform designed for vulnerable hilly and mountainous regions.
The platform combines sensor telemetry, risk analysis, geospatial visualization, historical disaster data, weather information, automated alerts, and AI-assisted emergency decision support into a unified Disaster Command Center.
🎯 Problem Statement
Hilly and mountainous regions are highly vulnerable to rapidly developing hazards such as:
🌊 Flash floods
⛰️ Landslides
🌧️ Cloudbursts
🌊 River-level surges
🌱 Soil saturation and slope instability
Traditional monitoring systems can struggle to provide localized and actionable information quickly enough.
Hill_Gaurd addresses this challenge by combining multiple sources of information into a single operational platform that can help authorities monitor risk, identify vulnerable areas, issue warnings, and coordinate emergency response.
🚀 Key Capabilities
📡 1. Real-Time IoT Telemetry
Hill_Gaurd monitors multiple environmental parameters from distributed telemetry stations.
Supported measurements
🌧️ Rainfall
🌊 River/water level
🌱 Soil moisture
⛰️ Slope stability
🌡️ Temperature
📍 Station/location information
🟢 Sensor health and connectivity
The command dashboard provides centralized visibility into the sensor network.
🤖 2. AI-Powered Risk Prediction
Hill_Gaurd combines environmental indicators to generate multi-hazard risk intelligence.
Risk dimensions
Rainfall
   │
   ├──► Flood Risk
   │
Water Level
   │
   └──► Overall Risk
        ▲
Soil Moisture ──► Landslide Risk
        ▲
Slope Stability
        ▲
Historical Risk
Risk classification
Score
Classification
0–29
🟢 Low
30–54
🟡 Moderate
55–74
🟠 High
75–100
🔴 Critical
The system can display:
Overall risk
Flood risk
Landslide risk
Risk trend
Lead-time estimate
Model version
Prediction inputs
Confidence/uncertainty information where available
Important: Risk predictions are decision-support outputs and should be validated against official monitoring and emergency-management procedures before real-world action.
🗺️ 3. Interactive GIS Risk Map
The GIS module provides a geographic view of disaster intelligence.
Map layers
🌊 Flood-risk areas
⛰️ Landslide-risk areas
📡 IoT monitoring stations
👥 Population/vulnerable communities
🏥 Emergency shelters
🚨 Active alerts
📍 Monitored locations
Built with:
Leaflet
React-Leaflet
OpenStreetMap-compatible map tiles
The map can be used to understand the spatial relationship between hazards, monitoring stations, population centers, and emergency resources.
🚨 4. Intelligent Alert Management
Hill_Gaurd provides a centralized alert-management system.
Alert levels
LOW
 ↓
MODERATE
 ↓
HIGH
 ↓
CRITICAL
Alerts can contain:
Hazard type
Severity
Location
Message
Timestamp
Expiration
Active/inactive state
Response status
The platform also supports emergency notification concepts such as:
SOS broadcasts
Alert escalation
Operator acknowledgement
Targeted notifications
Emergency response workflows
📊 5. Live Monitoring Dashboard
The command dashboard provides a consolidated operational view.
Dashboard indicators
Overall risk
Flood risk
Landslide risk
Active alerts
Sensor status
Weather conditions
Telemetry trends
Monitored locations
Emergency response information
Data can be refreshed periodically to provide updated operational information.
🧪 6. AI Simulation Lab
The Simulation Lab allows users to explore hypothetical disaster scenarios.
Example scenarios
Rainfall ↑
       +
Soil Saturation ↑
       +
River Level ↑
       ↓
Potential Hazard Risk ↑
Users can investigate how changing environmental parameters can affect the calculated risk.
Simulation capabilities
Flood scenarios
Landslide scenarios
What-if analysis
Risk comparison
Model inputs
Prediction outputs
Historical comparison
Model performance information
📈 7. Historical Disaster Intelligence
Hill_Gaurd maintains historical disaster information for analysis and comparison.
Historical analytics
Incident timeline
Disaster type
Location
Severity
Historical patterns
Seasonal trends
Risk comparison
Post-incident analysis
Supported reporting concepts include:
CSV export
PDF reports
Incident summaries
After-action analysis
🏥 8. Emergency Hub
The Emergency Hub centralizes emergency-response information.
Features
🏠 Shelter availability
👥 Shelter capacity
🚑 Responder information
📦 Resource allocation
📞 Emergency contacts
🛣️ Evacuation planning
📄 Situation Report generation
📢 Community communication
The goal is to connect risk intelligence with response coordination.
🤖 9. AI Emergency Assistant
Hill_Gaurd includes an AI-assisted disaster intelligence interface.
The emergency workflow follows a controlled multi-stage pipeline:
User Request
     │
     ▼
┌───────────────┐
│    Planner    │
└───────┬───────┘
        ▼
┌──────────────────┐
│ Safety Auditor   │
└────────┬─────────┘
         ▼
┌───────────────┐
│     Writer    │
└───────┬───────┘
        ▼
┌────────────────┐
│    Reviewer    │
└────────┬───────┘
         ▼
   Final Response
The AI layer can assist with:
Disaster-risk explanations
Emergency scenario analysis
Project knowledge
Learning modules
Incident reasoning
Situation-report generation
Emergency-response guidance
The AI assistant is designed as decision support, not as a replacement for emergency authorities or official warnings.
🔐 10. Authentication & Security
Hill_Gaurd implements multiple application-security controls.
Authentication
JWT authentication
Password hashing with bcrypt
Protected routes
Role-based access control
Session expiration
Login/logout handling
Password reset workflow
Password recovery
The password-reset system supports:
Secure random reset tokens
SHA-256 token hashing
Expiring reset tokens
Single-use reset tokens
Generic account-recovery responses
SMTP email delivery
Development-only reset-link fallback
Application security
Helmet security headers
CORS configuration
Express rate limiting
Input validation
MongoDB/Mongoose validation
Protected API routes
Environment-variable configuration
Request logging
👥 Role-Based Access Control
Hill_Gaurd supports role-oriented application access.
Role
Example Responsibilities
👑 Admin
User management, configuration, system administration
🏢 Authority
Risk monitoring, alerts and incident coordination
🚑 Responder
Emergency response and resource coordination
🧑‍💻 Operator
Monitoring and operational workflows
👤 Citizen
Public-facing information where enabled
Authorization is enforced on protected application routes and backend APIs.
🏗️ System Architecture
                         HILL_GAURD
                              │
                ┌─────────────┴─────────────┐
                │                           │
             DATA SOURCES              USER INPUT
                │                           │
        ┌───────┼────────┐                  │
        │       │        │                  │
      IoT    Weather   Historical           │
    Sensors    Data      Data               │
        │       │        │                  │
        └───────┴────────┘                  │
                 │                          │
                 ▼                          ▼
          ┌────────────────────────────────────┐
          │       DATA FUSION / API LAYER      │
          └────────────────┬───────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ RISK & PREDICTION ENGINE│
              └────────────┬───────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
          Flood        Landslide       Overall
           Risk           Risk           Risk
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                ┌────────────────────┐
                │ ALERT / ESCALATION │
                └──────────┬─────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           Dashboard      GIS       Emergency Hub
              │            │            │
              └────────────┼────────────┘
                           ▼
                    HUMAN DECISION
🧰 Technology Stack
Frontend
Technology
Purpose
React 19
UI framework
React Router v7
SPA routing
Vite
Build tooling
Axios
API communication
Leaflet
GIS mapping
React-Leaflet
React GIS integration
Chart.js
Data visualization
Lucide React
Icons
Motion
UI animations
CSS3
Styling and responsive design
Backend
Technology
Purpose
Node.js
Runtime
Express.js 5
REST API
MongoDB
Database
Mongoose 9
ODM
JWT
Authentication
bcryptjs
Password hashing
Helmet
Security headers
CORS
Cross-origin control
Morgan
HTTP logging
Express Rate Limit
API protection
AI / Data Tools
Google Gemini / GenAI integration
Python emergency tools
NASA GPM IMERG precipitation data tooling
MongoDB-backed AI memory
Risk-calculation engine
Historical disaster dataset
📁 Project Structure
Hill_Gaurd/
│
├── frontend/
│   ├── public/
│   │   └── assets/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── my_project/
│   ├── chat_terminal.py
│   ├── chat_api.py
│   ├── download_files_GPM_3IMERGDF_07.py
│   ├── requirements.txt
│   └── .env.example
│
├── OPERATOR_MANUAL.md
├── README.md
└── LICENSE
📋 Application Modules
Module
Route
Function
🏠 Home
/
Project overview
🔐 Login
/login
Authentication
🔑 Forgot Password
/forgot-password
Account recovery
🔄 Reset Password
/reset-password
Password reset
📊 Dashboard
/dashboard
Command center
📡 Live Monitoring
/dashboard/monitoring
IoT telemetry
🗺️ Risk Map
/dashboard/risk-map
GIS risk visualization
🚨 Alerts
/dashboard/alerts
Warning management
🧪 Simulation Lab
/dashboard/simulation
What-if analysis
📈 Historical Data
/dashboard/history
Disaster archive
🏥 Emergency Hub
/dashboard/emergency-hub
Response coordination
🤖 AI Assistant
/dashboard/ai-assistant
AI intelligence
⚙️ Mission Control
/dashboard/admin
Administration
🔌 REST API
Authentication
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password/:token
Sensors
GET  /api/sensors
GET  /api/sensors/:id
POST /api/sensors
POST /api/sensors/:id/data
DELETE /api/sensors/:id
Risk & Prediction
GET  /api/risk
POST /api/risk/predict
GET  /api/predictions
POST /api/risk/historical
Alerts
GET  /api/alerts
POST /api/alerts
GET  /api/alerts/:id
PUT  /api/alerts/:id
Weather
GET /api/weather
GET /api/weather/forecast
AI
POST   /api/ai/chat
GET    /api/ai/session
PATCH  /api/ai/session
DELETE /api/ai/session

POST /api/ai/emergency

GET /api/ai/study-modules
GET /api/ai/project-context
⚙️ Local Development
Prerequisites
Install:
Node.js 18+
npm 9+
MongoDB 6+
Git
Python 3.11+ for optional Python tools
1. Clone Repository
git clone https://github.com/ROHIT3470/Disaster-Management.git

cd Disaster-Management
2. Backend Setup
cd backend

npm install
Create:
backend/.env
Example:
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/disaster_management

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173

NODE_ENV=development

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM=Hill_Gaurd <your-email@gmail.com>
Start backend:
npm run dev
Backend:
http://localhost:5000
Health endpoint:
http://localhost:5000/api/health
3. Frontend Setup
Open another terminal:
cd frontend

npm install
Create:
frontend/.env
For local development:
VITE_API_URL=http://localhost:5000/api
Start:
npm run dev
Frontend:
http://localhost:5173
4. Database Seeding
From the backend directory:
npm run seed
⚠️ Warning: The current seed script clears existing application collections before inserting demo data. Do not execute it against a production database containing important data.
🔑 Demo Accounts
For local/demo environments:
Administrator
Email: admin@disaster.org
Password: admin123
Emergency Operator
Email: user@disaster.org
Password: user123
⚠️ Change or remove demo credentials before production deployment.
📧 Gmail Password Reset Configuration
For Gmail SMTP:
Enable 2-Step Verification.
Create a Google App Password.
Configure the SMTP variables.
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_FROM=Hill_Gaurd <your-email@gmail.com>
Do not use the normal Gmail account password as SMTP_PASSWORD.
Never commit .env files or API keys to GitHub.
🐍 Optional Python Tools
The project includes additional Python-based tools under:
my_project/
Install dependencies:
cd my_project

python -m pip install -r requirements.txt
Configure:
GEMINI_API_KEY=your-key
MONGO_URI=your-mongodb-uri
Example GPM downloader:
python download_files_GPM_3IMERGDF_07.py \
  --start 2025-08-31T00:00:00.000Z \
  --end 2025-09-30T23:59:59.000Z \
  --bbox 91.55,25.95,91.9,26.3 \
  --output-dir ./GPM_3IMERGDF_07 \
  --workers 5
🧪 Testing
Backend
cd backend

npm test
Frontend
cd frontend

npm run build
Preview production build:
npm run preview
📊 Performance Targets
The platform is designed around the following engineering targets:
Metric
Target
API response
<100 ms for typical cached/simple requests
Database query
<50 ms for indexed operations
Alert processing
Near-real-time
Dashboard refresh
~30 seconds
Frontend bundle
Optimized through code splitting
Availability
Production deployment dependent
Actual performance depends on infrastructure, database configuration, network conditions, traffic, and external APIs.
☁️ Production Deployment
Frontend
The Vite frontend can be deployed to:
Vercel
Netlify
Static hosting/CDN
Build:
cd frontend

npm run build
Output:
frontend/dist/
Configure:
VITE_API_URL=https://your-backend-domain/api
Backend
The Express backend can be deployed using a Node.js-compatible hosting provider.
Required production variables:
NODE_ENV=production

PORT=5000

MONGO_URI=mongodb+srv://...

JWT_SECRET=strong-random-production-secret

JWT_EXPIRES_IN=7d

CLIENT_URL=https://your-frontend-domain

SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_FROM=...
🍃 MongoDB Atlas
For production:
Create a MongoDB Atlas cluster.
Create a database user.
Configure network access.
Create the database connection string.
Add the connection string to MONGO_URI.
Never expose the database credentials in frontend code.
Example:
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/disaster_management
🔒 Production Security Checklist
Before deploying Hill_Gaurd publicly:
[ ] Remove demo credentials
[ ] Generate a strong JWT_SECRET
[ ] Configure MongoDB Atlas securely
[ ] Restrict CORS origins
[ ] Configure HTTPS
[ ] Configure SMTP securely
[ ] Never commit .env
[ ] Rotate exposed credentials
[ ] Enable production rate limiting
[ ] Validate all API inputs
[ ] Review authorization on every protected endpoint
[ ] Disable development reset-link responses
[ ] Configure secure logging
[ ] Review MongoDB indexes
[ ] Test password recovery
[ ] Test expired JWT handling
[ ] Test unauthorized API access
[ ] Test admin authorization
🛡️ Cybersecurity Considerations
Hill_Gaurd follows a security-oriented application architecture.
Authentication
User
 │
 ▼
Login
 │
 ▼
Credentials
 │
 ▼
bcrypt verification
 │
 ▼
JWT issued
 │
 ▼
Protected API
Password recovery
Forgot Password
       │
       ▼
Random Token
       │
       ▼
SHA-256 Hash
       │
       ▼
Database
       │
       ▼
Expiring Reset Link
       │
       ▼
Password Reset
       │
       ▼
Token Invalidated
Recommended future security enhancements include:
Refresh-token rotation
HttpOnly secure cookies
CSRF protection where cookie authentication is used
MFA
Audit-log integrity
Security event monitoring
Strong password policy
Account lockout/risk-based authentication
API schema validation
Automated dependency scanning
SAST/DAST in CI/CD
🔄 Development Workflow
Recommended Git workflow:
git checkout -b feature/<feature-name>

git add .

git commit -m "feat: add <feature>"

git push origin feature/<feature-name>
Then open a Pull Request.
Commit convention
feat: new functionality
fix: bug correction
refactor: code restructuring
docs: documentation
style: UI/formatting
test: tests
security: security improvement
perf: performance improvement
🧭 Future Roadmap
Phase 1 — Platform Hardening
[ ]
Production authentication architecture
[ ]
Advanced RBAC
[ ]
Audit logging
[ ]
API validation
[ ]
Automated testing
[ ]
CI/CD security checks
Phase 2 — Intelligence
[ ]
Improved ML models
[ ]
Model evaluation pipeline
[ ]
Feature importance visualization
[ ]
Prediction confidence calibration
[ ]
Model version registry
[ ]
Continuous model monitoring
Phase 3 — IoT
[ ]
MQTT integration
[ ]
Device authentication
[ ]
Sensor heartbeat monitoring
[ ]
Offline sensor detection
[ ]
Telemetry anomaly detection
[ ]
Real-time streaming
Phase 4 — GIS
[ ]
Advanced hazard polygons
[ ]
Evacuation-route analysis
[ ]
Shelter proximity analysis
[ ]
Population exposure estimation
[ ]
Terrain/elevation integration
[ ]
Satellite-data integration
Phase 5 — Emergency Operations
[ ]
Multi-agency coordination
[ ]
Resource tracking
[ ]
Incident command workflows
[ ]
Automated SITREP generation
[ ]
Notification provider integration
[ ]
Offline emergency mode
🧠 Engineering Philosophy
Hill_Gaurd follows:
SENSE
  ↓
Collect environmental information

FUSE
  ↓
Combine telemetry + weather + historical context

PREDICT
  ↓
Estimate hazard risk

ALERT
  ↓
Generate actionable warnings

RESPOND
  ↓
Coordinate emergency resources

LEARN
  ↓
Analyze historical incidents and improve models
The platform is designed around human-in-the-loop disaster intelligence, where automated systems support operational teams rather than replacing official emergency decision-making.
📚 Documentation
Additional documentation:
OPERATOR_MANUAL.md
The operator manual covers:
Dashboard operation
Monitoring
Risk maps
Alerts
Simulation
Historical data
Emergency Hub
AI assistant
Administration
Python tools
Troubleshooting
👨‍💻 Project
Project: Hill_Gaurd
Category: Disaster Management / Software
Focus: Flash Flood & Landslide Early Warning
Architecture: MERN + AI + IoT + GIS
Development Model: Full-stack web application
📜 License
This project is licensed under the MIT License.
See:
LICENSE
for details.
⚠️ Disclaimer
Hill_Gaurd is a software research/development project intended for disaster-management intelligence, simulation, education, and decision-support purposes.
Risk predictions, simulations, alerts, and AI-generated recommendations should not be treated as a substitute for official government warnings, trained emergency personnel, hydrological/geotechnical assessments, or established emergency-response protocols.
For real-world emergencies, follow instructions from the relevant official emergency-management authorities.
🏔️ Hill_Gaurd
Sense → Fuse → Predict → Alert → Respond
Technology for faster disaster intelligence and better-informed emergency coordination.
Built for disaster resilience.