# 🎾 Gina's Tennis World — Full Deployment Guide

## What You Need to Buy / Subscribe To

### Required (Minimum for Launch)

| Service | Provider | Cost | Purpose |
|---------|----------|------|---------|
| **Domain Name** | Namecheap, Google Domains, Cloudflare | ~$10-20/year | e.g., `ginastennisworld.com` |
| **Frontend Hosting** | Vercel (recommended for Next.js) | Free tier → $20/mo Pro | Serves the Next.js app globally |
| **Backend Hosting** | Render, Fly.io, or Railway | $7-25/mo | Runs the FastAPI backend |
| **PostgreSQL Database** | Render Postgres, Neon, or Supabase | Free tier → $7-25/mo | Managed database with backups |
| **SSL Certificate** | Included with Vercel/Cloudflare | Free | HTTPS encryption |

**Minimum monthly cost: ~$15-50/mo** (using free tiers where available)

### Recommended (Production)

| Service | Provider | Cost | Purpose |
|---------|----------|------|---------|
| **Payments** | Stripe | 2.9% + $0.30/transaction | Class & booking payments |
| **Email** | SendGrid or Postmark | Free tier → $15/mo | Transactional emails (welcome, booking confirmations) |
| **Media Storage** | Cloudflare R2 or AWS S3 | ~$1-10/mo | Video/image hosting |
| **CDN** | Cloudflare (free tier) | Free | Global performance + DDoS protection |
| **Monitoring** | Sentry | Free tier | Error tracking |

### Optional (Growth)

| Service | Provider | Cost | Purpose |
|---------|----------|------|---------|
| **SMS Notifications** | Twilio | Pay-as-you-go | Text reminders for bookings |
| **Video Streaming** | Vimeo or Mux | $20+/mo | Optimized video delivery |
| **Advanced Analytics** | Plausible or PostHog | $9+/mo | Website analytics |

---

## Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│   Vercel     │────▶│   FastAPI    │
│  (Customer)  │◀────│  (Next.js)   │◀────│   Backend    │
│              │     │              │     │              │
│   Browser    │────▶│              │────▶│  PostgreSQL  │
│   (Gina)     │◀────│              │◀────│  Database    │
└──────────────┘     └──────────────┘     └──────────────┘
                           │                     │
                           │              ┌──────┴──────┐
                           │              │   Stripe    │
                           │              │  (Payments) │
                           │              └─────────────┘
                           │              ┌─────────────┐
                           │              │  SendGrid   │
                           │              │  (Emails)   │
                           │              └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  WebSocket  │
                    │  (Realtime) │
                    └─────────────┘
```

**Real-time sync flow:**
1. Customer books a class → API saves to DB → WebSocket notifies Gina's admin dashboard
2. Gina approves booking → API updates DB → WebSocket notifies customer → Both see the change instantly

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional, for PostgreSQL)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your settings (SQLite works for local dev)

# Run database migrations
alembic upgrade head

# Start the backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

```bash
# In the project root
npm install

# Copy environment file
cp .env.example .env.local

# Start the frontend
npm run dev
```

### 3. Using Docker (PostgreSQL)

```bash
# Start PostgreSQL + Backend + Frontend
docker-compose up -d

# Run migrations against the Docker database
docker-compose exec backend alembic upgrade head
```

---

## Database Migrations

After changing models in `backend/app/models.py`, create a migration:

```bash
cd backend
alembic revision --autogenerate -m "description of change"
alembic upgrade head
```

---

## Production Deployment

### Backend (Render.com)

1. Create a new **Web Service** on Render
2. Connect your GitHub repo
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from `.env.example`
5. Set `DB_ENGINE=postgresql` and point to your managed DB

### Frontend (Vercel)

1. Import your GitHub repo on Vercel
2. Set **Root Directory** to `/` (default)
3. Add environment variables:
   - `BACKEND_URL` = your Render backend URL
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = your Stripe publishable key
4. Deploy

### Database (Render Postgres / Neon / Supabase)

1. Create a managed PostgreSQL instance
2. Copy the **Internal URL** (for backend) and **External URL** (for migrations)
3. Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in your backend env vars
4. Run migrations: `alembic upgrade head`

---

## Stripe Setup

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the Dashboard
3. Set `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` in your env vars
4. Create a webhook endpoint pointing to `https://your-api.com/payments/stripe-webhook`
5. Set `STRIPE_WEBHOOK_SECRET` from the webhook signing secret
6. Use Stripe Checkout for payment flows (see frontend integration)

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_NAME` | No | Gina's Tennis World API | Application name |
| `ENVIRONMENT` | No | development | development/staging/production |
| `DB_ENGINE` | No | sqlite | sqlite or postgresql |
| `DB_HOST` | Yes* | localhost | PostgreSQL host |
| `DB_PORT` | Yes* | 5432 | PostgreSQL port |
| `DB_NAME` | Yes* | ginas_tennis | Database name |
| `DB_USER` | Yes* | postgres | Database user |
| `DB_PASSWORD` | Yes* | postgres | Database password |
| `JWT_SECRET` | **Yes** | - | Must be a secure random string in production |
| `JWT_ALGORITHM` | No | HS256 | JWT algorithm |
| `JWT_EXPIRE_MINUTES` | No | 1440 | Token expiry (24 hours) |
| `ALLOWED_ORIGINS` | No | localhost:3000 | CORS origins (JSON array) |
| `FRONTEND_URL` | No | http://localhost:3000 | Frontend URL for links |
| `STRIPE_SECRET_KEY` | Yes** | - | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Yes** | - | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes** | - | Stripe webhook signing secret |
| `STRIPE_CURRENCY` | No | usd | Payment currency |
| `EMAIL_PROVIDER` | No | console | console/sendgrid/postmark/mailgun |
| `SENDGRID_API_KEY` | Yes*** | - | SendGrid API key |
| `EMAIL_FROM_ADDRESS` | No | noreply@ginastennisworld.com | Sender email |
| `EMAIL_FROM_NAME` | No | Gina's Tennis World | Sender name |

\* Required when `DB_ENGINE=postgresql`
\** Required for payments
\*** Required when `EMAIL_PROVIDER=sendgrid`

### Frontend (`.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BACKEND_URL` | No | http://localhost:8000 | FastAPI backend URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes* | - | Stripe publishable key |
| `NEXT_PUBLIC_WS_URL` | No | auto-detected | WebSocket URL |

\* Required for payments

---

## Real-time Sync (WebSocket)

The app uses WebSocket connections for instant updates:

- **Customer books a class** → Gina's admin dashboard updates instantly
- **Gina approves a booking** → Customer sees the change immediately
- **New notification** → Appears in real-time without page refresh

The WebSocket endpoint is at `/realtime/ws?token=<jwt_token>`. The frontend `useRealtime()` hook handles connection, reconnection, and event dispatching automatically.

---

## Project Structure

```
GinasWeb/
├── backend/
│   ├── alembic/              # Database migrations
│   │   ├── env.py
│   │   └── versions/
│   │       └── 001_initial.py
│   ├── app/
│   │   ├── config.py         # Settings from env vars
│   │   ├── database.py       # SQLAlchemy engine + session
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── models.py         # ORM models (all tables)
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py       # Login / register
│   │   │   ├── users.py      # User CRUD
│   │   │   ├── bookings.py   # Court bookings
│   │   │   ├── classes.py    # Class sessions + enrollment
│   │   │   ├── assessments.py # 1-on-1 assessments
│   │   │   ├── calendar.py   # Calendar view
│   │   │   ├── email.py      # Bulk email
│   │   │   ├── opentimes.py  # Open time slots
│   │   │   ├── scheduleblocks.py # Schedule blocks
│   │   │   ├── chatmessages.py   # Chat widget messages
│   │   │   ├── notifications.py  # 🆕 Notifications CRUD
│   │   │   ├── payments.py        # 🆕 Payments + Stripe webhooks
│   │   │   ├── dashboard.py      # 🆕 Admin dashboard stats
│   │   │   └── realtime.py        # 🆕 WebSocket real-time sync
│   │   └── services/
│   │       ├── auth.py       # Password hashing + JWT
│   │       └── seed.py       # Demo data seeder
│   ├── .env                  # Environment variables (gitignored)
│   ├── .env.example          # Template for env vars
│   ├── alembic.ini           # Alembic config
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile
├── src/
│   ├── app/                  # Next.js pages
│   ├── components/           # React components
│   ├── context/              # Auth context
│   ├── hooks/
│   │   └── useRealtime.ts    # 🆕 WebSocket hook
│   ├── lib/
│   │   └── api.ts            # API client (updated with new endpoints)
│   └── data/                 # Static data
├── docker-compose.yml        # Docker setup (updated with health checks)
├── Dockerfile.frontend
├── package.json              # Updated with @stripe/stripe-js
└── DEPLOYMENT_GUIDE.md       # This file
```

---

## Security Checklist

- [ ] Change `JWT_SECRET` to a 64+ character random string
- [ ] Set `ENVIRONMENT=production` in production
- [ ] Use HTTPS everywhere (Vercel + Cloudflare handle this)
- [ ] Set proper `ALLOWED_ORIGINS` (only your domain)
- [ ] Enable PostgreSQL SSL (`sslmode=require`)
- [ ] Set up database backups (daily automated)
- [ ] Rate limit API endpoints (add `slowapi` middleware)
- [ ] Validate all user inputs (Pydantic schemas handle most)
- [ ] Keep dependencies updated (`pip audit`, `npm audit`)
- [ ] Set up Stripe webhook signature verification
- [ ] Add CORS restrictions in production