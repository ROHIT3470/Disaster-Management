# Architecture & Technical Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Browser)                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ React 19 SPA + React Router                                 ││
│  │ - Home Page (Landing)                                       ││
│  │ - Authentication (Login/Register)                           ││
│  │ - Dashboard (Command Center)                                ││
│  │ - 8 Feature Pages (Monitoring, Alerts, Map, etc.)           ││
│  │ - Legal Pages (Privacy, Terms)                              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Axios HTTP Client                                           ││
│  │ - Request Interceptors (Auth Headers)                       ││
│  │ - Response Interceptors (Error Handling)                    ││
│  │ - Base URL: https://api.yourdomain.com                      ││
│  │ - Rate Limiting: 300 req/15 min                             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   NODE.JS/EXPRESS BACKEND                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ REST API Endpoints                                          ││
│  │ ┌────────────────────────────────────────────────────────┐ ││
│  │ │ Authentication Routes                                 │ ││
│  │ │ POST /api/auth/register                              │ ││
│  │ │ POST /api/auth/login                                 │ ││
│  │ │ GET  /api/auth/me (Protected)                        │ ││
│  │ └────────────────────────────────────────────────────────┘ ││
│  │ ┌────────────────────────────────────────────────────────┐ ││
│  │ │ Data Routes                                           │ ││
│  │ │ GET  /api/alerts                                      │ ││
│  │ │ GET  /api/sensors                                     │ ││
│  │ │ GET  /api/predictions                                 │ ││
│  │ │ GET  /api/weather                                     │ ││
│  │ │ POST /api/disasters                                   │ ││
│  │ │ GET  /api/locations                                   │ ││
│  │ └────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Middleware Stack                                            ││
│  │ - Helmet (Security Headers)                                 ││
│  │ - CORS (Cross-Origin Support)                               ││
│  │ - Morgan (Request Logging)                                  ││
│  │ - JWT Auth (Protected Routes)                               ││
│  │ - Rate Limiting (DDoS Protection)                           ││
│  │ - Error Handling (Global)                                   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (MongoDB)                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Collections                                                 ││
│  │ - users (Authentication & Profiles)                         ││
│  │ - alerts (Early Warnings)                                   ││
│  │ - sensors (IoT Device Data)                                 ││
│  │ - predictions (ML Model Outputs)                            ││
│  │ - disasters (Incident Records)                              ││
│  │ - locations (Geographic Data)                               ││
│  │ - weather (Meteorological Data)                             ││
│  │ - shelters (Relief Infrastructure)                          ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Indexes                                                     ││
│  │ - Compound indexes on frequently queried fields             ││
│  │ - Geospatial indexes for location queries                   ││
│  │ - TTL indexes for log retention                             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 EXTERNAL INTEGRATIONS                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ - Weather API (OpenWeatherMap)                              ││
│  │ - SMS Gateway (Twilio)                                      ││
│  │ - Map Tiles (Leaflet/OpenStreetMap)                         ││
│  │ - Email Service (SendGrid)                                  ││
│  │ - Monitoring (Sentry, New Relic)                            ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
User Action (Browser)
      ↓
React Component State Update
      ↓
API Call (Axios)
      ↓
Express Route Handler
      ↓
Middleware (Auth, Validation)
      ↓
Controller Logic
      ↓
Service Layer (Business Logic)
      ↓
MongoDB Query
      ↓
Database Response
      ↓
Service Processing
      ↓
HTTP Response (JSON)
      ↓
Axios Interceptor
      ↓
Context/State Update
      ↓
Component Re-render
      ↓
Updated UI
```

---

## Authentication Flow

```
1. User enters credentials → Login Page
2. POST /api/auth/login
3. Backend validates credentials
4. Generate JWT token
5. Return token + user data
6. Store token in localStorage
7. Set Authorization header
8. Redirect to Dashboard
9. All subsequent requests include JWT
10. Protected routes verify token
11. If expired: refresh token or redirect to login
```

---

## File Organization

### Frontend Structure
```
frontend/
├── public/
│   └── assets/
│       ├── logo.png
│       ├── favicon.ico
│       └── map-placeholder.png
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── AlertCard.jsx
│   │   ├── RiskCard.jsx
│   │   ├── WeatherCard.jsx
│   │   ├── MapView.jsx
│   │   ├── SensorCard.jsx
│   │   ├── TelemetryChart.jsx
│   │   ├── SOSModal.jsx
│   │   ├── SituationReportModal.jsx
│   │   ├── ToastContainer.jsx
│   │   └── Loading.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── ToastContext.jsx
│   ├── pages/
│   │   ├── Home.jsx (Landing)
│   │   ├── Contact.jsx
│   │   ├── Privacy.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── LiveMonitoring.jsx
│   │   ├── RiskMap.jsx
│   │   ├── Alerts.jsx
│   │   ├── SimulationLab.jsx
│   │   ├── HistoricalData.jsx
│   │   ├── EmergencyHub.jsx
│   │   └── AdminPanel.jsx
│   ├── services/
│   │   └── api.js
│   ├── styles/
│   │   ├── index.css (Global)
│   │   ├── App.css (App-wide)
│   │   ├── Home.css (Landing)
│   │   ├── Legal.css (Contact/Privacy)
│   │   ├── Animations.css
│   │   ├── modern.css
│   │   ├── App-premium.css
│   │   ├── login-premium.css
│   │   └── dashboard-premium.css
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
└── index.html
```

### Backend Structure
```
backend/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── alertController.js
│   ├── disasterController.js
│   ├── locationController.js
│   ├── riskController.js
│   ├── sensorController.js
│   ├── userController.js
│   └── weatherController.js
├── middleware/
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── models/
│   ├── User.js
│   ├── Alert.js
│   ├── Disaster.js
│   ├── Location.js
│   ├── Risk.js
│   ├── Sensor.js
│   ├── Weather.js
│   └── Shelter.js
├── routes/
│   ├── authRoutes.js
│   ├── alertRoutes.js
│   ├── disasterRoutes.js
│   ├── locationRoutes.js
│   ├── riskRoutes.js
│   ├── sensorRoutes.js
│   ├── userRoutes.js
│   └── weatherRoutes.js
├── services/
│   ├── predictService.js
│   ├── alertService.js
│   └── notificationService.js
├── scripts/
│   └── seed.js
├── .env
├── .gitignore
├── server.js
└── package.json
```

---

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String (admin, operator, viewer),
  district: String,
  location: {
    coordinates: [Number], // [lon, lat]
    type: "Point"
  },
  contactPhone: String,
  notificationPreferences: {
    sms: Boolean,
    email: Boolean,
    inApp: Boolean
  },
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### Alert Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  level: String (Low, Moderate, High, Critical),
  type: String (Flood, Landslide, Cloudburst),
  location: {
    coordinates: [Number],
    type: "Point"
  },
  affectedDistricts: [String],
  riskScore: Number (0-100),
  leadTime: Number (hours),
  status: String (Active, Acknowledged, Resolved),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  resolvedAt: Date,
  affectedPopulation: Number
}
```

### Sensor Collection
```javascript
{
  _id: ObjectId,
  name: String,
  type: String (Rainfall, RiverGauge, SlopeStability),
  location: {
    coordinates: [Number],
    type: "Point"
  },
  district: String,
  status: String (Online, Offline, Maintenance),
  lastDataPoint: {
    value: Number,
    timestamp: Date,
    unit: String
  },
  batteryLevel: Number (0-100),
  signalStrength: Number,
  history: [{ value, timestamp }],
  createdAt: Date,
  updatedAt: Date
}
```

### Prediction Collection
```javascript
{
  _id: ObjectId,
  district: String,
  generatedAt: Date,
  validUntil: Date,
  predictions: {
    overallRisk: Number,
    floodRisk: Number,
    landslideRisk: Number,
    confidence: Number
  },
  modelVersion: String,
  sourceDataPoints: Number,
  leadTime: String
}
```

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-08-30T22:20:28Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error code",
  "statusCode": 400,
  "timestamp": "2026-08-30T22:20:28Z"
}
```

---

## Security Considerations

1. **Authentication**: JWT with 7-day expiration
2. **Authorization**: Role-based access control (RBAC)
3. **Encryption**: TLS 1.3 in transit, AES-256 at rest
4. **Password**: Bcryptjs with 12 salt rounds
5. **Rate Limiting**: 300 requests/15 minutes per IP
6. **CORS**: Whitelist only trusted origins
7. **Input Validation**: Joi schemas on all endpoints
8. **SQL Injection**: No SQL (uses MongoDB)
9. **XSS Protection**: React escapes by default + CSP headers
10. **CSRF Protection**: SameSite cookie attribute

---

## Performance Optimization

### Frontend
- Code splitting by route
- Lazy loading components
- Image optimization (WebP)
- CSS minification
- JS minification & tree-shaking
- HTTP/2 Server Push
- Service Worker caching

### Backend
- Database indexing
- Query optimization
- Caching (Redis)
- Connection pooling
- Gzip compression
- CDN for static assets
- Load balancing

---

## Monitoring & Logging

### Application Logs
- Request/Response logging (Morgan)
- Error logging (Sentry)
- Performance metrics (New Relic)
- Custom business logic logs

### Database Monitoring
- Query performance
- Connection pool usage
- Replication lag
- Disk space

---

*Documentation Last Updated: 2026-08-30*
