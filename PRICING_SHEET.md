# 💰 Gina's Tennis World — Complete Pricing Sheet

> **Last Updated:** June 2026  
> **Architecture:** Next.js 14 (App Router) + FastAPI + PostgreSQL  
> **Deployment:** Full AWS (replacing Vercel/Render)

---

## 📊 Monthly Cost Summary

| Category | Service | Monthly Cost |
|----------|---------|-------------|
| **Frontend Hosting** | AWS Amplify | $0 – $15 |
| **Backend Hosting** | AWS App Runner | $16 – $35 |
| **Database** | AWS RDS PostgreSQL | $12 – $30 |
| **Email** | AWS SES | $0 – $5 |
| **Domain & SSL** | Route 53 + ACM | $1.50 |
| **File Storage** | AWS S3 | $0.25 – $2 |
| **CDN** | CloudFront | $1 – $5 |
| **Monitoring** | CloudWatch | $0 – $5 |
| **Secrets** | AWS Secrets Manager | $0.40 |
| **Payment Processing** | Stripe | 2.9% + $0.30/tx |
| | | |
| **TOTAL (est.)** | | **$31 – $99/mo** |

---

## 1. 🖥️ Frontend Hosting — AWS Amplify

| Item | Detail |
|------|--------|
| **Service** | AWS Amplify Hosting |
| **What it does** | Serves the Next.js SSR/SSG app with automatic builds from GitHub |
| **Free tier** | 5 GB storage, 15 GB data transfer/mo, 1,000 build minutes/mo |
| **Expected cost** | $0 – $15/mo (free tier likely covers it) |
| **Overage** | $0.01/GB data transfer, $0.01/1,000 requests |

### Setup Steps
1. Go to AWS Amplify Console → "New app" → "Host web app"
2. Connect GitHub repo (`Hakerz-ag/GinasWeb`)
3. Build settings:
   ```
   Build command:  npm run build
   Output dir:     .next
   Node version:   18
   ```
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://api.ginastennisworld.com`
5. Custom domain: `www.ginastennisworld.com` (via Route 53)

---

## 2. ⚙️ Backend Hosting — AWS App Runner

| Item | Detail |
|------|--------|
| **Service** | AWS App Runner |
| **What it does** | Runs the FastAPI backend with auto-scaling |
| **Instance** | 0.25 vCPU / 0.5 GB RAM (minimum) |
| **Expected cost** | $16 – $35/mo |
| **Pricing** | $0.007/hour per instance (1 instance = ~$5/mo) |

### Cost Breakdown
| Config | vCPU | RAM | Est. Monthly |
|--------|------|-----|-------------|
| Minimum (1 instance) | 0.25 | 0.5 GB | ~$16 |
| Recommended (1 instance) | 0.5 | 1 GB | ~$25 |
| High traffic (2 instances) | 0.5 | 1 GB | ~$50 |

### Setup Steps
1. Create `Dockerfile` in `backend/` (already exists)
2. AWS App Runner Console → "Create service" → "Source: ECR"
3. Build & push Docker image to ECR, or use App Runner's GitHub integration
4. Environment variables:
   ```
   DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/ginasweb
   JWT_SECRET=<generate-64-char-secret>
   JWT_SECRET_PREV=<previous-secret-if-rotating>
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=AKIA...
   SMTP_PASS=...
   SENTRY_DSN=https://...@sentry.io/...
   ```
5. Auto-scaling: min 1, max 3 instances
6. Health check: `GET /health`

---

## 3. 🐘 Database — AWS RDS PostgreSQL

| Item | Detail |
|------|--------|
| **Service** | Amazon RDS for PostgreSQL |
| **What it does** | Production database replacing SQLite |
| **Instance** | db.t3.micro (Free Tier eligible) or db.t4g.micro |
| **Storage** | 20 GB gp3 |
| **Expected cost** | $12 – $30/mo |

### Cost Breakdown
| Config | vCPU | RAM | Storage | Est. Monthly |
|--------|------|-----|---------|-------------|
| Free Tier (12 mo) | 2 | 1 GB | 20 GB | $0 |
| db.t4g.micro | 2 | 1 GB | 20 GB | ~$12/mo |
| db.t3.small | 2 | 2 GB | 20 GB | ~$30/mo |

### Setup Steps
1. AWS RDS Console → "Create database"
2. Engine: **PostgreSQL 16**, Template: **Free tier** or **Production**
3. DB instance: `ginasweb-db`
4. Master username: `ginasweb_admin`
5. Master password: `<generate-strong-password>`
6. Storage: 20 GB gp3, auto-scaling to 50 GB
7. **Security Group**: Allow inbound 5432 only from App Runner
8. **Public access**: No (VPC only)
9. **Automated backups**: 7-day retention
10. **Multi-AZ**: Enable for production ($$$)

### Migration from SQLite
```bash
# After RDS is running, update backend/app/config.py:
# DATABASE_URL = postgresql://ginasweb_admin:password@ginasweb-db.xxx.us-east-1.rds.amazonaws.com:5432/ginasweb

# Run Alembic migrations:
cd backend
alembic upgrade head
```

---

## 4. 📧 Email — AWS SES

| Item | Detail |
|------|--------|
| **Service** | Amazon Simple Email Service |
| **What it does** | Sends booking confirmations, password resets, notifications |
| **Expected cost** | $0 – $5/mo |

### Pricing
| Item | Cost |
|------|------|
| First 3,000 emails/mo | **FREE** (in sandbox) |
| After production approval | $0.10 per 1,000 emails |
| Attachment storage | $0.09/GB |

### Setup Steps
1. AWS SES Console → "Verify domain" → `ginastennisworld.com`
2. Add DNS records (DKIM, SPF, DMARC) in Route 53
3. Request production access (move out of sandbox)
4. Create SMTP credentials in SES Console
5. Update backend env vars:
   ```
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=AKIA...
   SMTP_PASS=...
   FROM_EMAIL=noreply@ginastennisworld.com
   ```

---

## 5. 🌐 Domain & SSL — Route 53 + ACM

| Item | Detail |
|------|--------|
| **Domain registrar** | Any (Namecheap, GoDaddy, etc.) |
| **DNS** | Amazon Route 53 |
| **SSL/TLS** | AWS Certificate Manager (ACM) |
| **Expected cost** | $1.50/mo (hosted zone) |

### Cost Breakdown
| Item | Cost |
|------|------|
| Domain registration | ~$10-15/year |
| Route 53 hosted zone | $0.50/mo |
| Route 53 queries | ~$0.40/mo (est. 1M queries) |
| ACM certificate | **FREE** |
| **Total** | **~$1.50/mo** |

### DNS Records
| Record | Type | Value |
|--------|------|-------|
| `ginastennisworld.com` | A | CloudFront distribution |
| `www.ginastennisworld.com` | CNAME | Amplify app URL |
| `api.ginastennisworld.com` | CNAME | App Runner URL |
| MX | MX | SES inbound (optional) |

---

## 6. 📦 File Storage — AWS S3

| Item | Detail |
|------|--------|
| **Service** | Amazon S3 |
| **What it does** | Stores user uploads, profile photos, class images |
| **Expected cost** | $0.25 – $2/mo |

### Cost Breakdown
| Item | Cost |
|------|------|
| Storage (5 GB) | $0.12/mo |
| PUT requests (1,000) | $0.005 |
| GET requests (10,000) | $0.007 |
| Data transfer | Free (via CloudFront) |

### Setup Steps
1. Create S3 bucket: `ginasweb-uploads-us-east-1`
2. Enable versioning and server-side encryption
3. CORS policy for frontend origin
4. IAM policy for App Runner to read/write
5. CloudFront distribution for public reads

---

## 7. 🚀 CDN — Amazon CloudFront

| Item | Detail |
|------|--------|
| **Service** | Amazon CloudFront |
| **What it does** | Caches static assets (JS, CSS, images) globally |
| **Expected cost** | $1 – $5/mo |

### Cost Breakdown
| Item | Cost |
|------|------|
| Data transfer out (10 GB) | $0.85 |
| HTTPS requests (100K) | $0.01 |
| HTTP requests (100K) | $0.0075 |

### Setup Steps
1. CloudFront Console → "Create distribution"
2. Origin: S3 bucket `ginasweb-uploads-us-east-1`
3. Alternate domain: `cdn.ginastennisworld.com`
4. SSL certificate: ACM wildcard `*.ginastennisworld.com`
5. Cache policy: CachingOptimized
6. Price class: UseOnlyNorthAmericaAndEurope

---

## 8. 📊 Monitoring — CloudWatch

| Item | Detail |
|------|--------|
| **Service** | Amazon CloudWatch |
| **What it does** | Logs, metrics, alarms for backend & database |
| **Expected cost** | $0 – $5/mo |

### Cost Breakdown
| Item | Cost |
|------|------|
| Logs ingestion (5 GB) | $0.50 |
| Logs storage (5 GB) | $0.15 |
| Custom metrics (10) | $0.30 |
| Alarms (3) | $0.30 |
| Dashboard (1) | $0.30 |

### Recommended Alarms
| Alarm | Threshold | Action |
|-------|-----------|--------|
| App Runner health | 3 consecutive failures | Email notification |
| RDS CPU | > 80% for 5 min | Email notification |
| RDS storage | > 80% utilization | Email notification |
| 5xx error rate | > 5% for 2 min | Email notification |

---

## 9. 🔐 Secrets — AWS Secrets Manager

| Item | Detail |
|------|--------|
| **Service** | AWS Secrets Manager |
| **What it does** | Stores JWT secrets, DB passwords, API keys |
| **Expected cost** | $0.40/mo |

### Secrets to Store
| Secret | Description |
|--------|-------------|
| `ginasweb/db-password` | RDS master password |
| `ginasweb/jwt-secret` | JWT signing key |
| `ginasweb/stripe-keys` | Stripe API keys |
| `ginasweb/smtp-credentials` | SES SMTP credentials |

---

## 10. 💳 Payment Processing — Stripe

| Item | Detail |
|------|--------|
| **Service** | Stripe |
| **What it does** | Processes credit card payments for classes & bookings |
| **Monthly fee** | $0 (pay-per-transaction) |

### Pricing
| Item | Cost |
|------|------|
| Online payments | 2.9% + $0.30 per transaction |
| In-person (Terminal) | 2.7% + $0.05 per transaction |
| ACH transfers | 0.8% per transaction (max $5) |
| Refunds | Full refund, no fee |
| Chargebacks | $15 per dispute |

### Revenue Estimates
| Monthly Volume | Stripe Fees |
|---------------|-------------|
| $1,000 | ~$32 |
| $5,000 | ~$160 |
| $10,000 | ~$320 |
| $25,000 | ~$800 |

---

## 11. 🐛 Error Tracking — Sentry

| Item | Detail |
|------|--------|
| **Service** | Sentry (Developer plan) |
| **What it does** | Real-time error tracking & performance monitoring |
| **Expected cost** | $0 (free tier) – $26/mo (Team plan) |

### Free Tier Limits
| Item | Limit |
|------|-------|
| Events | 5,000/mo |
| Transactions | 10,000/mo |
| Replays | 50/mo |
| Attachments | 100 MB |

---

## 📋 Complete AWS Setup Checklist

### Phase 1: Foundation (Day 1)
- [ ] Create AWS account
- [ ] Set up IAM user with MFA
- [ ] Create VPC with public/private subnets (us-east-1)
- [ ] Register/transfer domain to Route 53
- [ ] Request ACM certificate for `*.ginastennisworld.com`

### Phase 2: Database (Day 1-2)
- [ ] Create RDS PostgreSQL instance (db.t4g.micro)
- [ ] Configure security group (5432 from App Runner only)
- [ ] Create database `ginasweb`
- [ ] Run Alembic migrations
- [ ] Verify connection from local machine

### Phase 3: Backend (Day 2-3)
- [ ] Build Docker image for FastAPI backend
- [ ] Push to Amazon ECR
- [ ] Create App Runner service from ECR image
- [ ] Configure environment variables (DB URL, JWT secret, Stripe keys, etc.)
- [ ] Set up auto-scaling (min 1, max 3)
- [ ] Verify health check endpoint
- [ ] Create API subdomain: `api.ginastennisworld.com`

### Phase 4: Frontend (Day 3-4)
- [ ] Connect GitHub repo to AWS Amplify
- [ ] Configure build settings (Node 18, `npm run build`)
- [ ] Set environment variables (`NEXT_PUBLIC_API_URL`)
- [ ] Deploy and verify
- [ ] Create www subdomain: `www.ginastennisworld.com`

### Phase 5: Email (Day 4-5)
- [ ] Verify domain in SES
- [ ] Add DKIM/SPF/DMARC DNS records
- [ ] Request production access
- [ ] Create SMTP credentials
- [ ] Test email sending

### Phase 6: Storage & CDN (Day 5-6)
- [ ] Create S3 bucket for uploads
- [ ] Configure CORS policy
- [ ] Create CloudFront distribution
- [ ] Set up IAM policy for App Runner → S3 access
- [ ] Test file upload/download

### Phase 7: Monitoring & Security (Day 6-7)
- [ ] Set up CloudWatch log groups
- [ ] Create alarms (health, CPU, storage, errors)
- [ ] Store secrets in Secrets Manager
- [ ] Configure Sentry DSN
- [ ] Enable AWS WAF (optional, ~$5/mo)
- [ ] Enable AWS Shield Standard (free, DDoS protection)

### Phase 8: Go Live (Day 7)
- [ ] Update DNS to point to AWS
- [ ] Enable Stripe live mode
- [ ] Run full end-to-end test
- [ ] Monitor for 24 hours
- [ ] Set up billing alerts

---

## 💵 Cost Comparison: AWS vs Alternatives

| Provider | Frontend | Backend | DB | Total/mo |
|----------|----------|---------|-----|----------|
| **AWS (recommended)** | $0-15 | $16-35 | $12-30 | **$31-99** |
| Vercel + Render | $0-20 | $7-35 | $7-20 | $14-75 |
| Vercel + Railway | $0-20 | $5-20 | $5-20 | $10-60 |
| DigitalOcean App Platform | — | $5-20 | $5-15 | $10-35 |
| Fly.io | — | $3-10 | $3-7 | $6-17 |

> **Note:** AWS costs more but provides enterprise-grade reliability, security, and scalability. The free tier covers most costs for the first 12 months.

---

## 📈 Scaling Cost Projections

| Users/mo | AWS Est. | Stripe Fees | Total |
|----------|----------|-------------|-------|
| 50 | $31 | $15 | **$46** |
| 200 | $45 | $60 | **$105** |
| 500 | $65 | $150 | **$215** |
| 1,000 | $99 | $300 | **$399** |
| 5,000 | $180 | $1,500 | **$1,680** |

---

## ⚠️ One-Time Setup Costs

| Item | Cost |
|------|------|
| Domain registration (1 yr) | $10-15 |
| SSL certificate (ACM) | FREE |
| AWS account setup | FREE |
| Stripe account setup | FREE |
| Sentry account setup | FREE |
| **Total one-time** | **$10-15** |

---

## 🔄 Recurring Annual Costs

| Item | Annual Cost |
|------|------------|
| Domain renewal | $10-15/yr |
| AWS Support (Basic) | FREE |
| AWS Support (Business) | $100+/mo |
| Sentry Team plan | $312/yr |
| **Total annual** | **$10-15/yr** (without paid support) |

---

*Generated for Gina's Tennis World — June 2026*