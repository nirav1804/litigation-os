# ⚖️ Litigation OS — AI-Powered Indian Litigation Management

Production-ready SaaS for Indian lawyers, law firms, and in-house legal teams.
Manage litigation, automate drafting, prepare for hearings, streamline workflows.

---

## 🚀 Quick Start (3 steps)

```bash
# 1. Copy and configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET, GROQ_API_KEY, POSTGRES_PASSWORD

# 2. Start everything
docker compose up --build

# 3. Create MinIO bucket + seed demo data
./scripts/setup-minio.sh
docker compose exec backend npx ts-node prisma/seed.ts
```

Open **http://localhost:3000**
Login: `admin@sharmaassociates.in` / `Password@123`

---

## 📋 Prerequisites

- Docker + Docker Compose
- Groq API key (free at https://console.groq.com)

---

## 🏗️ Architecture

```
litigation-os/
├── backend/                    # NestJS REST + GraphQL API
│   ├── src/
│   │   ├── auth/               # JWT, refresh tokens, RBAC, password reset
│   │   ├── matters/            # Core matter management + GraphQL resolver
│   │   ├── documents/          # S3 upload, PDF parsing, AI extraction
│   │   ├── ai/                 # Chat, drafting, research, hearing prep (Groq)
│   │   │   └── services/       # RAG (TF-IDF), drafting, research, hearing prep
│   │   ├── tasks/              # Task management with deadlines
│   │   ├── hearings/           # Scheduling, outcomes, adjournments
│   │   ├── clients/            # Client portal (scoped access)
│   │   ├── analytics/          # Dashboard, caseload, aging, productivity
│   │   ├── users/              # User management, invites
│   │   ├── organizations/      # Multi-tenant orgs, court config
│   │   ├── health/             # Health check endpoint
│   │   ├── common/
│   │   │   └── services/       # MailService, AuditService, RemindersService
│   │   └── config/             # Joi environment validation
│   └── prisma/
│       ├── schema.prisma       # 18 models full schema
│       └── seed.ts             # Demo data (4 users, 3 matters, hearings, tasks)
├── frontend/                   # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── (app)/          # Protected routes
│       │   │   ├── dashboard/  # Stats, charts, upcoming hearings, tasks
│       │   │   ├── matters/    # List + [id] detail (6 tabs) + new
│       │   │   ├── documents/  # Hub + [id] viewer
│       │   │   ├── ai/         # Hub + draft screen + research screen
│       │   │   ├── tasks/      # My tasks
│       │   │   ├── hearings/   # Upcoming hearings calendar
│       │   │   ├── analytics/  # Charts, aging, productivity
│       │   │   ├── clients/    # Client portal + lawyer view
│       │   │   ├── admin/      # Team management, courts
│       │   │   └── settings/   # Profile, password, notifications
│       │   └── auth/           # Login, register
│       ├── components/
│       │   ├── layout/         # Sidebar, TopBar
│       │   ├── matters/        # 6 matter tab components
│       │   └── ui/             # ShadCN primitives + Tabs
│       ├── hooks/              # All React Query API hooks
│       ├── stores/             # Zustand (auth + UI state)
│       └── lib/                # Axios client, utils
├── nginx/                      # Production Nginx config
├── scripts/                    # setup-minio.sh, backup-db.sh
└── docker-compose.yml
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register + create org |
| POST | `/api/v1/auth/login` | Login → tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Invalidate refresh token |
| POST | `/api/v1/auth/forgot-password` | Send reset email |
| POST | `/api/v1/auth/reset-password` | Reset with token |
| GET | `/api/v1/auth/profile` | Current user |

### Matters
```
GET    /api/v1/matters                     List (paginated, search, filter)
POST   /api/v1/matters                     Create
GET    /api/v1/matters/stats               Dashboard stats
GET    /api/v1/matters/:id                 Full detail
PATCH  /api/v1/matters/:id                 Update
DELETE /api/v1/matters/:id                 Delete
POST   /api/v1/matters/:id/assignments     Assign user
DELETE /api/v1/matters/:id/assignments/:uid Remove assignment
POST   /api/v1/matters/:id/parties         Add party
PATCH  /api/v1/matters/:id/parties/:pid    Update party
DELETE /api/v1/matters/:id/parties/:pid    Remove party
GET    /api/v1/matters/:id/timeline        Timeline events
GET    /api/v1/matters/:id/notes           Notes
POST   /api/v1/matters/:id/notes           Add note
```

### Documents
```
POST   /api/v1/documents/upload             Upload + process
GET    /api/v1/documents/matter/:matterId   By matter
GET    /api/v1/documents/:id                Get doc
GET    /api/v1/documents/:id/download       Signed download URL
POST   /api/v1/documents/presigned-upload   Direct S3 upload URL
POST   /api/v1/documents/:id/version        New version
DELETE /api/v1/documents/:id                Delete
```

### AI Engine
```
POST   /api/v1/ai/summarize/:documentId     Summarize document
POST   /api/v1/ai/chronology/:matterId      Extract chronology
POST   /api/v1/ai/draft/:matterId           Generate draft (4 types)
POST   /api/v1/ai/research/:matterId        Legal research
POST   /api/v1/ai/hearing-prep/:hearingId   Hearing preparation brief
POST   /api/v1/ai/chat/:matterId            RAG-based chat
GET    /api/v1/ai/outputs/:matterId         Saved AI outputs
PATCH  /api/v1/ai/outputs/:id/save          Save output
```

### Tasks
```
POST   /api/v1/tasks                        Create
GET    /api/v1/tasks/my                     My tasks
GET    /api/v1/tasks/upcoming               Upcoming deadlines
GET    /api/v1/tasks/matter/:matterId       By matter
PATCH  /api/v1/tasks/:id                    Update
DELETE /api/v1/tasks/:id                    Delete
```

### Hearings
```
POST   /api/v1/hearings                     Schedule
GET    /api/v1/hearings/upcoming            Upcoming (next N days)
GET    /api/v1/hearings/matter/:matterId    By matter
GET    /api/v1/hearings/:id                 Detail
PATCH  /api/v1/hearings/:id                 Update/record outcome
POST   /api/v1/hearings/:id/notes           Add note
DELETE /api/v1/hearings/:id                 Delete
```

### Analytics
```
GET    /api/v1/analytics/dashboard          Full dashboard
GET    /api/v1/analytics/matters            Matter stats
GET    /api/v1/analytics/caseload           Caseload by user
GET    /api/v1/analytics/aging              Matter aging
GET    /api/v1/analytics/productivity       Productivity metrics
```

### GraphQL
Available at `/graphql` (playground in dev mode):
```graphql
query { matters(page: 1, search: "ABC") { data { id title status } total } }
query { matter(id: "...") { id title parties { name type } } }
mutation { createMatter(input: { title: "...", type: CIVIL }) { id } }
```

---

## 🛡️ RBAC Roles

| Permission | ADMIN | SR. LAWYER | ASSOCIATE | CLERK | CLIENT |
|---|:---:|:---:|:---:|:---:|:---:|
| Create/edit matter | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete matter | ✅ | ✅ | ❌ | ❌ | ❌ |
| Upload documents | ✅ | ✅ | ✅ | ✅ | ❌ |
| Use AI features | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage team | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own matters | ✅ | ✅ | ✅ | ✅ | ✅* |

*Clients see only matters they are linked to, public notes only.

---

## 🤖 AI Features (Groq-powered)

| Feature | Model | Description |
|---------|-------|-------------|
| Document Summarization | llama-3.3-70b | Structured summary of legal docs |
| Chronology Extraction | llama-3.3-70b | Timeline of events from all documents |
| Affidavit Draft | llama-3.3-70b | Full affidavit with verification clause |
| Written Submissions | llama-3.3-70b | Structured arguments with case law |
| Adjournment Application | llama-3.3-70b | Formal adjournment application |
| Synopsis | llama-3.3-70b | 3-5 page case synopsis |
| Legal Research | llama-3.3-70b | Indian case law + statute analysis |
| Hearing Prep Brief | llama-3.3-70b | Arguments, questions, checklist |
| Matter Chat (RAG) | llama-3.3-70b | Ask questions about your matter |
| Entity Extraction | llama-3.1-8b | Parties, dates, sections from docs |

---

## 🗄️ Database Schema (18 models)

`Organization` → `User` → `ClientProfile`
`Matter` → `Party`, `Document`, `Hearing`, `Task`, `Note`, `AIOutput`, `Citation`, `TimelineEvent`
`MatterAssignment`, `MatterClient`, `HearingNote`
`AuditLog`, `RefreshToken`

---

## ⚙️ Production Deployment

### DigitalOcean / VPS
See `DEPLOY.md` for full step-by-step guide.

```bash
# Quick summary:
git clone https://github.com/YOUR_ORG/litigation-os /opt/litigation-os
cd /opt/litigation-os
cp .env.example .env   # Fill in values
docker compose up -d --build
./scripts/setup-minio.sh
docker compose exec backend npx ts-node prisma/seed.ts

# Nginx
cp nginx/litigation-os.conf /etc/nginx/sites-available/litigation-os
ln -s /etc/nginx/sites-available/litigation-os /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### Daily Backups
```bash
# Add to crontab (crontab -e):
0 2 * * * /opt/litigation-os/scripts/backup-db.sh >> /var/log/litigation-os-backup.log 2>&1
```

### Health Check
```
GET https://api.yourdomain.com/api/v1/health
→ { "status": "ok", "services": { "database": "ok", "api": "ok" } }
```

---

## 🔧 Local Development

```bash
# Start dependencies only
docker compose up postgres minio -d

# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run start:dev
# → http://localhost:3001/api/v1

# Frontend
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| UI Components | ShadCN UI (Radix primitives) |
| State | Zustand + TanStack React Query |
| Backend | NestJS, TypeScript, REST + GraphQL |
| Auth | JWT + Refresh tokens, Passport.js, RBAC |
| Database | PostgreSQL 16 + Prisma ORM |
| File Storage | AWS S3 / MinIO |
| AI | Groq (llama-3.3-70b, llama-3.1-8b, mixtral-8x7b) |
| RAG | TF-IDF in-memory (swap for Pinecone in production) |
| Email | Nodemailer (SMTP / Gmail / SendGrid) |
| Scheduling | NestJS Schedule (cron — hearing reminders, task alerts) |
| Infra | Docker, docker-compose, Nginx |

---

## 📋 Demo Login Credentials

All use password: `Password@123`

| Role | Email |
|------|-------|
| Admin | admin@sharmaassociates.in |
| Senior Lawyer | priya@sharmaassociates.in |
| Associate | arjun@sharmaassociates.in |
| Clerk | ravi@sharmaassociates.in |

Organization slug: `sharma-associates`
