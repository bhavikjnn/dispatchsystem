# Deployment Guide - Order Dispatch System

## Pre-Deployment Checklist

- [ ] Environment variables configured (.env.local tested locally)
- [ ] MongoDB Atlas cluster created and tested
- [ ] Sample data seeded and verified
- [ ] All features tested in development
- [ ] Build completes without errors: `npm run build`
- [ ] No console errors in browser (F12)
- [ ] Authentication works end-to-end
- [ ] Filter functionality verified
- [ ] CSV export tested
- [ ] Audit logs tracking works

## Option 1: Deploy to Vercel (Recommended)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/order-dispatch.git
git push -u origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Import Project"
4. Select your repository
5. Project settings auto-detected
6. Click "Deploy"

### Step 3: Add Environment Variables
In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add `MONGODB_URI` (production MongoDB Atlas URI)
3. Add `JWT_SECRET` (secure, random string - 32+ chars)
4. Redeploy: Settings → Deployments → Redeploy

### Step 4: Verify Deployment
- Click deployment URL
- Test login/register
- Test admin features
- Run `npm run seed` locally and verify data syncs

## Option 2: Deploy to AWS EC2

### Step 1: Launch EC2 Instance
```bash
# Recommended: Ubuntu 22.04 LTS, t3.small or larger
# Security group: Allow 80, 443, 22
```

### Step 2: Setup Server
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install nginx as reverse proxy
sudo apt install -y nginx
```

### Step 3: Clone and Setup
```bash
# Clone repository
git clone https://github.com/yourusername/order-dispatch.git
cd order-dispatch

# Install dependencies
npm install

# Create .env.local
nano .env.local
# Paste: MONGODB_URI=... and JWT_SECRET=...

# Build
npm run build

# Start with PM2
pm2 start npm --name "dispatch" -- start
pm2 startup
pm2 save
```

### Step 4: Configure Nginx
```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/default

# Replace with:
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: SSL Certificate (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Option 3: Deploy to Google Cloud Run

### Step 1: Prepare Dockerfile
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Step 2: Deploy
```bash
# Install gcloud CLI and authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/dispatch

# Deploy
gcloud run deploy dispatch \
  --image gcr.io/YOUR_PROJECT_ID/dispatch \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars MONGODB_URI=...,JWT_SECRET=...
```

## Option 4: Deploy to DigitalOcean App Platform

### Step 1: Connect Repository
1. Push code to GitHub
2. Go to DigitalOcean Dashboard
3. Apps → Create App
4. Select GitHub repository
5. Auto-detects Next.js

### Step 2: Configure
1. Set environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
2. Set node environment to `production`
3. Deploy

## Post-Deployment Tasks

### 1. Verify Application
```bash
curl https://yourdomain.com
# Should see HTML response
```

### 2. Seed Production Data
```bash
# Option A: Use seed script (if you have MongoDB access)
# Run locally with production MONGODB_URI
npm run seed

# Option B: Manual entry via UI
# Create admin account
# Create sample orders manually
```

### 3. Security Hardening
- [ ] Change JWT_SECRET to unique value
- [ ] Enable CORS if needed
- [ ] Set secure cookies (HTTPS only)
- [ ] Implement rate limiting
- [ ] Enable MongoDB authentication
- [ ] Whitelist IP addresses if needed
- [ ] Regular security updates

### 4. Monitoring
- Set up error tracking (Sentry)
- Monitor MongoDB performance
- Check application logs
- Set up uptime monitoring
- Monitor database backups

### 5. Backup Strategy
```bash
# MongoDB Backup (Atlas)
# - Atlas handles automated backups
# - Configure retention policy (30+ days)

# Application Code
# - Version controlled in Git
# - Multiple branches (main, develop)

# Environmental Backups
# - Document all env vars
# - Secure storage for secrets
```

## Scaling Considerations

### Database Scaling
```
Development:  MongoDB free tier
Production:   MongoDB M10+ cluster with:
              - Automatic backups
              - Replication (3 nodes)
              - Sharding (if 10M+ documents)
```

### Application Scaling
```
Small (10-100 users):
  - Single server (t3.small or equivalent)
  - 1GB RAM, 1 CPU sufficient

Medium (100-1000 users):
  - Larger instance (t3.medium)
  - 2GB RAM, 2 CPU
  - CDN for static assets

Large (1000+ users):
  - Load balancer
  - Multiple application servers
  - MongoDB Atlas M20+
  - Redis cache for sessions
```

## Common Issues & Solutions

### Issue: Build fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Issue: Can't connect to MongoDB
- Verify connection string (include password special chars)
- Check IP whitelist in MongoDB Atlas
- Test locally before deploying
- Check network connectivity from server

### Issue: Slow performance
- Enable MongoDB indexes
- Add CDN for static assets
- Implement caching headers
- Monitor slow queries
- Optimize images

### Issue: Authentication not working
- Clear cookies in browser
- Verify JWT_SECRET consistency
- Check token expiration (24 hours default)
- Verify email/password in database

## Monitoring & Alerts

### Recommended Services
- **Error Tracking**: Sentry.io
- **Uptime Monitoring**: Uptime Robot
- **Performance**: New Relic / DataDog
- **Log Aggregation**: LogDNA / Papertrail

### Key Metrics to Monitor
- Application response time
- Error rate
- MongoDB connection pool usage
- Disk space utilization
- Memory usage
- Request latency

## Rollback Procedure

### If deployment fails:
```bash
# On Vercel: One-click rollback in dashboard
# On AWS: Revert to previous AMI or previous deployment
# On any server:
pm2 list
pm2 kill
git checkout previous-commit-hash
npm install && npm run build
pm2 start "npm start"
```

## Maintenance Windows

- Schedule weekly backups
- Monthly security updates
- Quarterly performance reviews
- Semi-annual dependency updates

## Success Indicators

✅ Application loads within 2 seconds
✅ All API endpoints respond in <500ms
✅ Zero authentication errors
✅ CSV export completes <10 seconds
✅ Filters return results instantly
✅ Audit logs update in real-time
✅ Mobile experience is smooth
✅ No console errors

## Getting Help

- Check application logs for errors
- Review MongoDB performance
- Verify environment variables
- Test locally before deploying changes
- Use browser DevTools (F12) for debugging
