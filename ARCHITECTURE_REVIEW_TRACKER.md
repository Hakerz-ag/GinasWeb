# Architecture Review Report — Fix Tracker

> **Source:** Gina's Tennis World — Architecture Review Report (Prism AI, June 21, 2026)  
> **Last Updated:** June 26, 2026

---

## 🔴 P0 — CRITICAL (Fix Within 1 Week)

| # | Issue | Status | Details |
|---|-------|--------|---------|
| 1 | **No rate limiting on `/auth/login` and `/auth/register`** | ✅ FIXED | Added `slowapi` rate limiting: 5/min on login, 3/min on register, 1/min on chat messages |
| 2 | **FastAPI OpenAPI docs exposed in production** | ✅ FIXED | `/docs`, `/redoc`, `/openapi.json` disabled when `ENVIRONMENT=production` |
| 3 | **No database backup strategy** | ✅ FIXED | Created `.github/workflows/backup.yml` — daily `pg_dump` uploaded as GitHub Release |
| 4 | **JWT tokens with no refresh mechanism or revocation** | ✅ FIXED | Implemented short-lived access tokens (15 min) + refresh tokens (7 days) stored in DB. Refresh token rotation prevents reuse. Logout revokes refresh token. Password reset revokes all tokens. |
| 5 | **Admin accounts have no MFA** | ✅ FIXED | TOTP-based MFA implemented using `pyotp`. All users can enable MFA in Settings. Login requires 6-digit code when MFA is enabled. QR code generated for authenticator apps. |
| 6 | **CORS misconfiguration risk** | ✅ FIXED | Restricted `allow_methods` to specific verbs, `allow_headers` to `Authorization` + `Content-Type`, added production domain to `allowed_origins` |
| 7 | **No HTTP security headers** | ✅ FIXED | Added `SecurityHeadersMiddleware` to FastAPI + security headers in `next.config.js` (X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) |

---

## 🟠 P1 — HIGH (Fix Within 1 Month)

| # | Issue | Status | Details |
|---|-------|--------|---------|
| 8 | **No Sentry/error tracking** | ✅ FIXED | Added `sentry-sdk[fastapi]` to requirements, initializes from `SENTRY_DSN` env var |
| 9 | **Admin MFA with TOTP** | ✅ FIXED | TOTP-based MFA using `pyotp` + `qrcode`. Setup via Settings page, QR code for authenticator apps, 6-digit verification on login. |
| 10 | **JWT refresh token implementation** | ✅ FIXED | Same as #4 — implemented refresh token rotation with DB-backed revocation, 15-min access tokens, 7-day refresh tokens |
| 11 | **Missing DB indexes on FK columns** | ✅ FIXED | Added 11 indexes via Alembic migration `002_security_and_schema.py` (bookings, payments, enrollments, assessments, notifications, sub_accounts) |
| 12 | **Payment audit log** | ✅ FIXED | Added `confirmed_by` and `confirmed_at` columns to payments table |
| 13 | **Ambiguous `related_id` in payments** | ✅ FIXED | Added explicit `booking_id` and `enrollment_id` FK columns to payments table (kept `related_id` for backward compat) |
| 14 | **No staging environment** | 🔴 NOT DONE | Every git push deploys to production. Needs: `develop` branch → staging Vercel preview + staging Render service |
| 15 | **Neon pooled connection endpoint** | ✅ DONE (config ready) | `DATABASE_URL_OVERRIDE` env var already supports pooler endpoint. Just needs the pooler URL set in production env |
| 16 | **Render spins down despite UptimeRobot** | 🔴 NOT DONE | Needs Render Starter ($7/mo) upgrade to eliminate cold starts |
| 17 | **Anonymous chat_messages — no user linkage** | ✅ FIXED | Added nullable `user_id` FK to `chat_messages` table + `reply_to` column |
| 18 | **Stored XSS risk in free-text fields** | ✅ FIXED | Added `bleach.clean()` sanitization on chat messages, assessments notes, and notifications |
| 19 | **SMTP TLS/DNS records unknown** | 🔴 NOT DONE | Needs: SPF, DKIM, DMARC DNS records configured. Consider switching to SendGrid/Resend |
| 20 | **JWT_SECRET rotation plan missing** | ✅ FIXED | Implemented key versioning with `kid` header. `JWT_SECRET` is current key (kid="1"), `JWT_SECRET_PREV` is previous key (kid="0"). Tokens signed with old key remain valid until they expire. |

---

## 🟡 P2 — MEDIUM (Next Quarter)

| # | Issue | Status | Details |
|---|-------|--------|---------|
| 21 | **Soft-delete pattern for bookings/payments** | ✅ FIXED | Added `deleted_at` column to `court_bookings`, `payments`, and `class_enrollments` tables |
| 22 | **Calendar table should be a VIEW** | 🔴 NOT DONE | Needs: `CREATE OR REPLACE VIEW v_calendar AS ...` migration + update calendar router |
| 23 | **Upgrade Render to Starter ($7/mo)** | 🔴 NOT DONE | Infrastructure change — needs billing setup |
| 24 | **Redis caching for class schedules** | 🔴 NOT DONE | Needs: Upstash Redis integration, cache class listings (TTL: 5 min), available slots (TTL: 1 min) |
| 25 | **SPF/DKIM/DMARC DNS records** | 🔴 NOT DONE | Same as #19 — DNS configuration needed |
| 26 | **Refund workflow & receipt generation** | 🔴 NOT DONE | Needs: `/refunds` endpoint, Stripe refund API integration, PDF/HTML receipt generation |
| 27 | **GDPR data deletion for sub_accounts** | ✅ FIXED | Added `DELETE /users/me/data` endpoint that cascades deletion: soft-deletes bookings/payments/enrollments, deletes notifications, anonymizes chat messages, deletes sub-accounts and user |
| 28 | **Move video assets to CDN** | ✅ FIXED | All videos converted to YouTube embeds (1.1GB of local MP4s removed). No local video files served through Vercel. |
| 29 | **XSS sanitization on free-text inputs** | ✅ FIXED | Added `bleach.clean()` on chat messages, assessment notes, and notification messages |
| 30 | **No structured JSON logging** | ✅ FIXED | Added `JSONFormatter` class to FastAPI `main.py`, quieted noisy loggers |
| 31 | **No database query monitoring** | ✅ FIXED | Added SQLAlchemy event listeners to log queries exceeding 500ms threshold |
| 32 | **PII in sub_accounts (GDPR/CCPA risk)** | 🟡 PARTIAL | GDPR deletion endpoint added. Still needs: encrypt `birth_date` at application level |
| 33 | **Venmo/Zelle/cash payments have no verification** | ✅ FIXED | Added `confirmed_by`/`confirmed_at` audit fields, transaction reference on confirmation, automated email on payment confirmation, monthly reconciliation endpoint (`GET /payments/reconciliation`) |
| 34 | **PostgreSQL 18 in production (beta)** | 🔴 NOT DONE | Needs: migrate Neon to PG 16 LTS or PG 17 stable |

---

## ✅ Already Addressed (From Previous 21 UI Fixes)

| # | Report Issue | What Was Fixed |
|---|-------------|----------------|
| A | Chat messages — no reply functionality | ✅ Added reply button + inline reply input in admin |
| B | Admin dashboard — users not sorted | ✅ Sorted users alphabetically |
| C | Admin dashboard — past classes shown | ✅ Filtered out past classes |
| D | Admin — block section missing date field | ✅ Added date field to block form + display |
| E | Admin — duplicate blocks can be created | ✅ Added duplicate block prevention |
| F | Admin — message response not possible | ✅ Added reply functionality |
| G | Chat widget visible to admin | ✅ Hidden chat widget for admin users |
| H | No cancel booking for customers | ✅ Added cancel button on booking cards |
| I | Skill level filter broken for unassessed users | ✅ Fixed to show beginner classes for beginners |

---

## 📊 Summary

| Priority | Total | Fixed | Remaining |
|----------|-------|-------|-----------|
| **P0 Critical** | 7 | 7 | 0 |
| **P1 High** | 13 | 10 | 3 |
| **P2 Medium** | 14 | 8 | 6 |
| **UI Fixes** | 9 | 9 | 0 |
| **Grand Total** | 43 | 34 | 9 |

### ✅ All P0 Critical Items Complete!

### 🟠 Remaining P1 High Items (Infrastructure)

1. **Staging environment** — Create `develop` branch with Vercel preview + Render staging
2. **Render upgrade** — Upgrade to Starter ($7/mo) to eliminate cold starts
3. **Email DNS records** — Configure SPF, DKIM, DMARC for email deliverability

### 🟡 Remaining P2 Medium Items

1. **Calendar table → VIEW** — Convert to PostgreSQL VIEW or materialized view
2. **Redis caching** — Upstash Redis for class schedules (TTL: 5 min)
3. **SPF/DKIM/DMARC** — Same as P1 #19
4. **Refund workflow** — Stripe refund API integration + receipt generation
5. **PII encryption** — Encrypt `birth_date` at application level
6. **PostgreSQL 18 → 16 LTS** — Migrate Neon to stable PG version