# 🚀 Litigation OS — Complete Hosting & Deployment Guide

This guide covers deploying Litigation OS on:
1. **Local development** (fastest, free)
2. **Railway** (easiest cloud, ~$5/month)
3. **DigitalOcean Droplet / VPS** (full control, ~$12/month)
4. **AWS EC2 + RDS + S3** (production-grade)

---

## OPTION 1: Local Development (Start Here)

### Requirements
- Node.js 20+ (`node --version`)
- Docker Desktop (`docker --version`)
- Git

### Step 1: Environment Setup
```bash
# Clone / extract the project
cd litigation-os

# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env — REQUIRED:
#   GROQ_API_KEY=gsk_your_groq_key
#   JWT_SECRET=run: openssl rand -hex 32

# Frontend environment
cp frontend/.env.example frontend/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Step 2: Start Database + Storage
```bash
docker compose up postgres minio -d
# Wait ~10 seconds for postgres to initialize
```

### Step 3: Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts    # loads demo data
npm run start:dev
# ✅ Backend: http://localhost:3001/api/v1
```

### Step 4: Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
# ✅ Frontend: http://localhost:3000
```

### Step 5: Login
- URL: http://localhost:3000
- Email: `admin@sharmaassociates.in`
- Password: `Password@123`

---

## OPTION 2: Full Docker (One Command)

```bash
cd litigation-os
cp .env.example .env
# Edit .env:
#   GROQ_API_KEY=gsk_your_groq_key
#   JWT_SECRET=your-32-char-secret
#   POSTGRES_PASSWORD=strong-password

docker compose up --build

# ✅ Frontend: http://localhost:3000
# ✅ Backend:  http://localhost:3001/api/v1
# ✅ MinIO:    http://localhost:9001
```

### First-time seed with Docker:
```bash
docker compose exec backend npx ts-node prisma/seed.ts
```

---

## OPTION 3: Railway (Easiest Cloud Deploy)

Railway gives you free PostgreSQL + deploy from GitHub.

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/litigation-os
git push -u origin main
```

### Step 2: Deploy Backend on Railway
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your repo → select `/backend` directory
3. Add environment variables:
   ```
   DATABASE_URL       → (Railway auto-provides PostgreSQL URL)
   JWT_SECRET         → openssl rand -hex 32
   GROQ_API_KEY     → gsk_your_groq_key
   AWS_ACCESS_KEY_ID  → your-key
   AWS_SECRET_ACCESS_KEY → your-secret
   S3_BUCKET          → litigation-os-prod
   AWS_REGION         → ap-south-1
   FRONTEND_URL       → https://your-frontend.railway.app
   NODE_ENV           → production
   PORT               → 3001
   ```
4. Set start command: `node dist/main`
5. Set build command: `npm install && npx prisma generate && npm run build && npx prisma migrate deploy`

### Step 3: Deploy Frontend on Railway
1. New Service → GitHub Repo → select `/frontend`
2. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL → https://your-backend.railway.app/api/v1
   ```
3. Build command: `npm install && npm run build`
4. Start command: `npm start`

### Step 4: PostgreSQL on Railway
- Add Plugin → PostgreSQL → Railway auto-injects `DATABASE_URL`

### Step 5: Seed production database
```bash
# In Railway backend service terminal:
npx ts-node prisma/seed.ts
```

---

## OPTION 4: DigitalOcean VPS ($12/month Droplet)

### Step 1: Create Droplet
- Ubuntu 22.04, 2GB RAM, 50GB SSD
- Enable SSH key authentication

### Step 2: Server Setup
```bash
ssh root@YOUR_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install docker-compose
apt install -y docker-compose-plugin

# Install Nginx
apt install -y nginx certbot python3-certbot-nginx

# Clone your repo
git clone https://github.com/YOUR_USERNAME/litigation-os /opt/litigation-os
cd /opt/litigation-os
```

### Step 3: Configure Environment
```bash
cp .env.example .env
nano .env
# Fill in:
#   POSTGRES_PASSWORD=very-strong-password
#   JWT_SECRET=run-openssl-rand-hex-32
#   GROQ_API_KEY=gsk_your_groq_key
#   FRONTEND_URL=https://yourdomain.com
#   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

### Step 4: Start Application
```bash
docker compose up -d --build

# Seed database
docker compose exec backend npx ts-node prisma/seed.ts
```

### Step 5: Configure Nginx
```bash
nano /etc/nginx/sites-available/litigation-os
```

```nginx
# Frontend
server {
    server_name yourdomain.com www.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    server_name api.yourdomain.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 50M;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/litigation-os /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# SSL certificates
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

### Step 6: Auto-restart on reboot
```bash
systemctl enable docker
# Docker compose auto-restarts because of `restart: unless-stopped`
```

---

## OPTION 5: AWS Production Setup

### Services Used
- **EC2** t3.medium — application server
- **RDS** PostgreSQL — managed database
- **S3** — document storage (replace MinIO)
- **CloudFront** — CDN for frontend

### Step 1: RDS PostgreSQL
```bash
# Create RDS instance (PostgreSQL 15, db.t3.micro for dev)
# Note the endpoint URL for DATABASE_URL
```

### Step 2: S3 Bucket
```bash
# Create bucket: litigation-os-prod
# Region: ap-south-1 (Mumbai)
# Block public access: ON
# Create IAM user with S3 policy, get access keys
```

### Step 3: EC2 Setup
```bash
# Ubuntu 22.04, t3.medium
# Security groups: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000, 3001

# SSH in and follow DigitalOcean steps above
# But use RDS URL for DATABASE_URL
# Remove MinIO from docker-compose (use real S3)
# Remove S3_ENDPOINT from .env for real AWS S3
```

### Step 4: Frontend on Vercel (alternative)
```bash
# Push frontend folder to separate GitHub repo
# Import to Vercel
# Set NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
# Deploy automatically on push
```

---

## 🔒 Production Security Checklist

```bash
# 1. Generate strong JWT secret
openssl rand -hex 32

# 2. Strong database password (20+ chars)
openssl rand -base64 20

# 3. Update CORS in backend .env
FRONTEND_URL=https://yourdomain.com  # NOT localhost

# 4. Remove MinIO from production (use real S3)
# Delete minio service from docker-compose.yml

# 5. Enable SSL everywhere (HTTPS)
# Use certbot or AWS ACM

# 6. Set NODE_ENV=production
NODE_ENV=production

# 7. Database backups
# RDS: Enable automated backups
# Self-hosted: pg_dump cron job

# 8. Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
# Block direct access to 3000 and 3001 (go through Nginx)
```

---

## 📊 MinIO Setup (Local S3)

MinIO is included in docker-compose as a free S3-compatible alternative.

### Create bucket after starting:
```bash
# Access MinIO console: http://localhost:9001
# Login: minioadmin / minioadmin_secret (or your .env values)
# Create bucket: litigation-os
# Set bucket policy to private
```

Or via CLI:
```bash
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin_secret
docker compose exec minio mc mb local/litigation-os
```

---

## 🔧 Common Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart a service
docker compose restart backend

# Database migrations
docker compose exec backend npx prisma migrate deploy

# Open Prisma Studio (DB browser)
docker compose exec backend npx prisma studio

# Reset database (WARNING: deletes all data)
docker compose exec backend npx prisma migrate reset

# Backup database
docker compose exec postgres pg_dump -U postgres litigation_os > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U postgres litigation_os

# Update application
git pull origin main
docker compose up -d --build
```

---

## 🌐 Domain Setup (DNS)

If you have a domain (e.g., `litigationos.in`):

| Record | Name | Value |
|--------|------|-------|
| A | @ | YOUR_SERVER_IP |
| A | www | YOUR_SERVER_IP |
| A | api | YOUR_SERVER_IP |

Point these to your VPS or load balancer IP.

---

## 💰 Cost Estimate

| Option | Monthly Cost |
|--------|-------------|
| Local dev | Free |
| Railway (starter) | ~$5–15 |
| DigitalOcean $12 droplet | ~$12 |
| AWS EC2 t3.small + RDS | ~$30–50 |
| AWS EC2 t3.medium + RDS + CloudFront | ~$60–80 |

---

## 📞 Support

- OpenAI API issues: https://console.groq.com
- Prisma issues: https://www.prisma.io/docs
- NestJS docs: https://docs.nestjs.com
- Next.js docs: https://nextjs.org/docs
