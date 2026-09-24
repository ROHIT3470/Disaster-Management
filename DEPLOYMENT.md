# 📋 Deployment Guide - Disaster Management System

This guide covers production deployment, CI/CD setup, and infrastructure provisioning.

---

## 🚀 Quick Start Deployment

### Local Development
```bash
# Frontend
cd frontend
npm install
npm run dev    # http://localhost:5173

# Backend (in another terminal)
cd backend
npm install
npm run dev    # http://localhost:5000
```

### Production Build

#### Frontend
```bash
cd frontend
npm run build
# Output: dist/ folder ready for hosting
```

#### Backend
```bash
cd backend
npm run start
```

---

## ☁️ Cloud Deployment Options

### 1. **Vercel (Frontend)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Configure environment variables in Vercel dashboard
VITE_API_URL=https://api.yourdomain.com
```

### 2. **Heroku (Backend)**
```bash
# Install Heroku CLI
npm i -g heroku

# Login
heroku login

# Create app
heroku create disaster-management-api

# Set environment variables
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your_secret

# Deploy
git push heroku main
```

### 3. **AWS (Full Stack)**

#### Frontend → CloudFront + S3
```bash
# Build frontend
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

#### Backend → EC2 or Elastic Beanstalk
```bash
# EC2 Deployment
ssh -i key.pem ec2-user@your-instance

# Install Node & PM2
sudo apt update
sudo apt install nodejs npm
npm i -g pm2

# Clone & Setup
git clone your-repo
cd backend
npm install
pm2 start server.js --name "disaster-api"
pm2 startup
pm2 save
```

### 4. **DigitalOcean (Full Stack)**

#### Using Docker Compose
```dockerfile
# Dockerfile (Backend)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:5173"
    environment:
      VITE_API_URL: http://localhost:5000

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb+srv://...
      JWT_SECRET: your_secret
      NODE_ENV: production

  mongodb:
    image: mongo:6
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password

volumes:
  mongodb_data:
```

Deploy to DigitalOcean App Platform:
```bash
doctl apps create --spec app.yaml
```

---

## 🔧 Environment Configuration

### Frontend (.env)
```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_ENV=production
VITE_LOG_LEVEL=error
```

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/disaster-db
JWT_SECRET=your_super_secret_key_with_min_32_chars
JWT_EXPIRE=24h
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📊 Database Setup

### MongoDB Atlas
```bash
# 1. Create cluster at mongodb.com/cloud
# 2. Create database user
# 3. Configure IP whitelist
# 4. Get connection string
# 5. Replace in .env

MONGODB_URI=mongodb+srv://user:pass@cluster-abc.mongodb.net/disaster-db
```

### Initialize Collections
```bash
cd backend
node scripts/seed-db.js
```

---

## 🔐 Security Checklist

- [ ] Enable HTTPS/TLS on all domains
- [ ] Set strong JWT_SECRET (minimum 32 characters)
- [ ] Configure MongoDB IP whitelist
- [ ] Enable rate limiting on API
- [ ] Set CORS to specific domain only
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS redirects
- [ ] Set security headers (Helmet.js)
- [ ] Configure CSRF protection
- [ ] Enable MongoDB encryption at rest
- [ ] Use secure HTTP cookies (httpOnly, secure, sameSite)
- [ ] Regular security audits

---

## 🔄 CI/CD Pipeline

### GitHub Actions (.github/workflows/deploy.yml)

```yaml
name: Deploy

on:
  push:
    branches: [main, production]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci
      
      - name: Run tests
        run: |
          cd frontend && npm run test
          cd ../backend && npm run test
      
      - name: Lint
        run: |
          cd frontend && npm run lint
          cd ../backend && npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: success()
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Frontend to Vercel
        uses: vercel/actions/build@main
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
      
      - name: Deploy Backend to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: ${{ secrets.HEROKU_APP_NAME }}
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
          appdir: "backend"
```

---

## 📈 Performance Optimization

### Frontend
- [ ] Enable gzip compression
- [ ] Minify CSS/JS
- [ ] Optimize images
- [ ] Code splitting
- [ ] Lazy load components
- [ ] Cache static assets
- [ ] CDN for static files

### Backend
- [ ] Database indexing
- [ ] Query optimization
- [ ] Connection pooling
- [ ] Response caching
- [ ] Compression middleware
- [ ] Load balancing

---

## 🔍 Monitoring & Logs

### Sentry (Error Tracking)
```bash
npm install @sentry/react @sentry/tracing
```

### CloudWatch / ELK Stack
```bash
# Backend logging
npm install winston

# Configure in server.js
const logger = require('winston');
logger.info('System started');
```

### Uptime Monitoring
- Use Pingdom or UptimeRobot
- Monitor critical endpoints
- Set up alerts

---

## 🔄 Backup & Recovery

### MongoDB Backup
```bash
# Automated daily backups via MongoDB Atlas
# Enable automated backups in Dashboard

# Manual backup
mongodump --uri "mongodb+srv://..." --out ./backup
```

### Disaster Recovery Plan
1. Daily backups to S3
2. Point-in-time recovery enabled
3. Regular restore testing (monthly)
4. RTO: 4 hours
5. RPO: 1 hour

---

## 📱 Scaling Strategy

### Horizontal Scaling
- Load balancer (AWS ALB / NLB)
- Multiple backend instances
- Database read replicas
- Redis cache layer

### Vertical Scaling
- Upgrade instance size
- Increase MongoDB storage
- Upgrade to higher tier database

### Auto-Scaling
```yaml
# AWS Auto Scaling Group
MinSize: 2
MaxSize: 10
DesiredCapacity: 3
TargetCPUUtilization: 70%
```

---

## 🎯 Post-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Database connection verified
- [ ] HTTPS/SSL configured
- [ ] DNS records pointing to correct IP
- [ ] Backup system activated
- [ ] Monitoring and alerts configured
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] User documentation ready
- [ ] Support team trained
- [ ] Communication plan executed

---

## 📞 Troubleshooting

### Frontend Won't Load
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

### API Connection Issues
```bash
# Check backend status
curl -i http://localhost:5000/api/health

# Check MongoDB connection
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://...').then(() => console.log('Connected'))"
```

### High Memory Usage
```bash
# Monitor process
node --max-old-space-size=4096 server.js

# Use PM2 with memory limits
pm2 start server.js --max-memory-restart 500M
```

---

## 📚 Additional Resources

- [Node.js Production Checklist](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [React Production Build](https://react.dev/learn/start-a-new-react-project)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Last Updated**: August 30, 2026  
**Maintained By**: Disaster Management Team
