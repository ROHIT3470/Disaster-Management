# 🚀 Quick Start Setup Guide
## Disaster Early Warning & Management System

---

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **MongoDB**: Atlas (cloud) or local installation
- **Git**: For version control
- **Code Editor**: VS Code recommended

**Check versions:**
```bash
node --version
npm --version
```

---

## ⚡ Quick Start (5 minutes)

### 1. Clone & Install
```bash
# Clone repository
git clone <your-repo-url>
cd "Disaster Management"

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Configure Environment

#### Frontend (.env)
```bash
cd frontend
# No .env needed for development (defaults to localhost:5000)
```

#### Backend (.env)
```bash
cd backend
# Create .env file
echo "MONGODB_URI=mongodb://localhost:27017/disaster-db" > .env
echo "JWT_SECRET=your_secret_key_min_32_chars" >> .env
echo "PORT=5000" >> .env
echo "NODE_ENV=development" >> .env
```

### 3. Start Services

#### Terminal 1: Backend
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

#### Terminal 2: Frontend
```bash
cd frontend
npm run dev
# App running on http://localhost:5173
```

### 4. Login
- **Admin**: admin@disaster.org / admin123
- **User**: user@disaster.org / user123

---

## 📚 Detailed Setup

### Frontend Setup

```bash
cd frontend

# Install all dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
```

**Frontend runs on**: `http://localhost:5173`

### Backend Setup

```bash
cd backend

# Install all dependencies
npm install

# Development mode (with auto-reload via nodemon)
npm run dev

# Production mode
npm start

# Run tests
npm run test
```

**Backend runs on**: `http://localhost:5000`

### Database Setup

#### Option A: MongoDB Local
```bash
# Install MongoDB
# Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
# macOS: brew install mongodb-community
# Linux: apt-get install mongodb

# Start MongoDB
mongod

# In .env, use:
MONGODB_URI=mongodb://localhost:27017/disaster-db
```

#### Option B: MongoDB Atlas (Cloud) - Recommended
1. Create account: https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Get connection string
5. Update .env:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/disaster-db
```

---

## 🔧 Environment Variables

### Frontend (.env)
```env
# Optional - defaults to http://localhost:5000
VITE_API_URL=http://localhost:5000

# Development vs Production
VITE_APP_ENV=development

# Logging level
VITE_LOG_LEVEL=debug
```

### Backend (.env)
```env
# ===== SERVER =====
NODE_ENV=development
PORT=5000

# ===== DATABASE =====
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/disaster-db

# ===== AUTHENTICATION =====
JWT_SECRET=your_super_secret_key_with_min_32_chars_for_security
JWT_EXPIRE=24h

# ===== CORS =====
CORS_ORIGIN=http://localhost:5173

# ===== RATE LIMITING =====
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window

# ===== LOGGING =====
LOG_LEVEL=debug
```

---

## 📖 Project Structure

```
Disaster Management/
├── frontend/                    # React Application
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable components
│   │   ├── context/            # State management
│   │   ├── services/           # API client
│   │   └── main.jsx            # Entry point
│   ├── styles/                 # CSS modules
│   ├── dist/                   # Production build
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # Node.js API
│   ├── routes/                 # API endpoints
│   ├── controllers/            # Business logic
│   ├── models/                 # Database schemas
│   ├── middleware/             # Auth, logging, etc
│   ├── config/                 # Configuration
│   ├── server.js               # Entry point
│   └── package.json
│
├── database/                   # Database setup
├── README.md                   # Project guide
├── DEPLOYMENT.md               # Production deployment
├── PROJECT_SUMMARY.md          # Project details
└── BUILD_VERIFICATION.md       # Build report
```

---

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test
npm run test:coverage
```

### Backend Tests
```bash
cd backend
npm run test
npm run test:coverage
```

### E2E Tests (Optional)
```bash
cd frontend
npm run cypress:open
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 5173 (frontend)
# macOS/Linux:
lsof -i :5173
kill -9 <PID>

# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Alternative: Change port in vite.config.js
# Or backend in .env (PORT=5001)
```

### MongoDB Connection Error
```bash
# Check MongoDB URI in .env
# Verify MongoDB service is running:
mongosh  # or mongo

# For Atlas: Whitelist your IP
# 1. Go to MongoDB Atlas Dashboard
# 2. Network Access
# 3. Add IP address
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Clear npm cache
npm cache clean --force
```

### CORS Error
```bash
# Update CORS_ORIGIN in backend .env
CORS_ORIGIN=http://localhost:5173

# Or in backend/middleware/cors.js
app.use(cors({
  origin: 'http://localhost:5173'
}));
```

### API Not Responding
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check logs in terminal
# Look for error messages

# Verify .env configuration
# Ensure MongoDB connected
```

---

## 📝 Demo Credentials

### Admin Account
```
Email: admin@disaster.org
Password: admin123
Role: Administrator
Access: Full system access
```

### User Account
```
Email: user@disaster.org
Password: user123
Role: Emergency Operator
Access: Telemetry surveillance
```

---

## 🚀 Deployment

### Frontend Deployment (Vercel)
```bash
npm i -g vercel
vercel
# Follow prompts to deploy
```

### Backend Deployment (Heroku)
```bash
npm i -g heroku
heroku login
heroku create your-app-name
git push heroku main
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production deployment guide.

---

## 📊 Performance

Expected performance on first load:
- Page load: < 2 seconds
- Time to interactive: < 3 seconds
- Largest contentful paint: < 2.5 seconds

See [BUILD_VERIFICATION.md](./BUILD_VERIFICATION.md) for detailed performance metrics.

---

## 🆘 Help & Support

### Common Issues
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
- Review [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for architecture
- Read code comments in source files

### Getting Help
1. Check documentation files
2. Review error messages carefully
3. Check browser console (F12)
4. Check server terminal logs
5. Create GitHub issue with details

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Docs](https://docs.mongodb.com)
- [Node.js Best Practices](https://nodejs.org/en/docs)

---

## ✅ Verification Checklist

After setup, verify:
- [ ] Frontend loads on http://localhost:5173
- [ ] Backend responds on http://localhost:5000
- [ ] Can log in with demo credentials
- [ ] Dashboard displays data
- [ ] No console errors (F12)
- [ ] Responsive on mobile (DevTools)
- [ ] Maps load correctly
- [ ] Charts display data

---

## 🎯 Next Steps

1. **Explore the Application**
   - Log in with demo credentials
   - Navigate through all pages
   - Test interactive features

2. **Understand the Code**
   - Read README.md for overview
   - Review component structure
   - Study API integration

3. **Deploy to Production**
   - Follow DEPLOYMENT.md guide
   - Configure environment variables
   - Test thoroughly before launch

4. **Contribute**
   - Fix bugs
   - Add features
   - Improve documentation

---

## 📞 Support

For questions or issues:
- Check documentation
- Review error messages
- Check browser/server console
- Create issue with details

---

**Happy Coding! 🚀**

Built with ❤️ for disaster risk reduction.  
Last Updated: August 30, 2026
