# 🚀 Gina's Tennis World — Production Readiness Checklist

> **Every single item needed to go live**, organized by priority.
> Check off items as you complete them. Estimated effort: 🔴 Critical | 🟡 Important | 🟢 Nice-to-have

---

## 0. DEPLOYMENT & SUBSCRIPTIONS (Pre-requisites)

- [ ] Set up **Neon** (PostgreSQL) database — create production database, get connection string
- [ ] Set up **Vercel** project — link repo, configure environment variables
- [ ] Set up **Render** (or alternative) for FastAPI backend — Docker deploy, env vars, health checks
- [ ] Configure **custom domain** DNS (point domain to Vercel + Render)
- [ ] Set up **SSL/TLS** certificates (Vercel handles frontend; Render needs config)
- [ ] Create production `.env` files for both frontend and backend (never commit these)
- [ ] Set **JWT_SECRET** to a strong random string (not `change-me-in-production`)
- [ ] Set **STRIPE_SECRET_KEY** and **STRIPE_PUBLISHABLE_KEY** to live keys (not test)
- [ ] Set **STRIPE_WEBHOOK_SECRET** and configure Stripe webhook endpoint URL
- [ ] Set **TWILIO_ACCOUNT_SID**, **TWILIO_AUTH_TOKEN**, **TWILIO_FROM_NUMBER** (if using SMS)
- [ ] Set **SENDGRID_API_KEY** or equivalent for transactional email
- [ ] Set **VENMO_HANDLE** (e.g., `@Gina-Tennis`) and **ZELLE_INFO** (e.g., email/phone)
- [ ] Remove **localhost** origins from `ALLOWED_ORIGINS` / `allowed_origins` in production
- [ ] Set **FRONTEND_URL** and **EMAIL_BASE_URL** to production domain
- [ ] Set **ENVIRONMENT=production** in backend config
- [ ] Run **Alembic migrations** against production database before starting the app
- [ ] Configure **Gunicorn + Uvicorn workers** for production (not just `uvicorn` directly)
- [ ] Add **HEALTHCHECK** to Docker Compose / Render config for both services

---

## 1. 🔴 SECURITY — Must Fix Before Launch

### 1.1 Authentication & Authorization

- [ ] **Add auth middleware to ALL API endpoints** — every route except `/auth/login` and `/auth/register` needs a `Depends(get_current_user)` check
- [ ] **Add admin role checks** — admin-only endpoints (user management, booking approval, payment confirmation, etc.) need `require_admin()` guard
- [ ] **Remove demo quick-login credentials** from `src/app/login/page.tsx` (lines ~170-180 expose `gina@ginastennisworld.com` / `admin123`)
- [ ] **Add rate limiting** to `/auth/login` and `/auth/register` (the `slowapi` limiter is imported but never applied with `.limit()`)
- [ ] **Add password strength validation** — minimum 8 chars, at least one number, one uppercase
- [ ] **Implement password reset flow** — `PasswordResetToken` model exists but no endpoint. Need:
  - [ ] `POST /auth/forgot-password` — generate token, send email
  - [ ] `POST /auth/reset-password` — validate token, update password
  - [ ] Frontend "Forgot Password" modal already exists but calls non-existent endpoint
- [ ] **Add email verification** — after registration, send verification link; don't allow login until verified (or until admin approves)
- [ ] **Add CSRF protection** — if using cookie-based auth, add CSRF tokens; if using Bearer tokens in localStorage, ensure CORS is strict
- [ ] **Add 401 response interceptor** on frontend — when JWT expires, redirect to login instead of showing errors

### 1.2 Input Validation

- [ ] **Validate date format** — all date fields (`date`, `start_date`, `end_date`) should validate `YYYY-MM-DD` format
- [ ] **Validate time format** — `start_time`, `end_time` should validate `HH:MM AM/PM` format
- [ ] **Validate phone number format** — basic format check on registration
- [ ] **Validate payment amounts** — `amount` must be > 0; prevent negative/zero payments
- [ ] **Validate booking date is in the future** — reject past dates
- [ ] **Validate `start_time < end_time`** for classes and bookings
- [ ] **Validate `max_students > 0`** and `party_size > 0`
- [ ] **Add email uniqueness check** on user update (return 409 instead of 500)
- [ ] **Sanitize all string inputs** — prevent XSS in notes, descriptions, names

### 1.3 API Security

- [ ] **Add global exception handler** — catch all unhandled errors, return consistent JSON (no stack traces in production)
- [ ] **Customize Pydantic validation errors** — FastAPI's default 422 responses expose internal schema details
- [ ] **Verify Stripe webhook signatures in production** — currently skipped when `STRIPE_WEBHOOK_SECRET` is empty
- [ ] **Add Content-Security-Policy header** — prevent XSS attacks
- [ ] **Add HSTS preload directive** to Strict-Transport-Security
- [ ] **Remove redundant security headers** — both Next.js config and SecurityHeadersMiddleware set the same headers
- [ ] **Secure the chat widget** — require auth or add CAPTCHA to prevent spam
- [ ] **Add request size limits** — prevent oversized payloads
- [ ] **Add SQL injection protection audit** — `database.py` uses f-strings for ALTER TABLE; verify all dynamic queries use parameterized statements

---

## 2. 🔴 CRITICAL MISSING FEATURES

### 2.1 Booking & Scheduling

- [ ] **Add booking conflict detection** — when creating a booking, check that the court/time slot isn't already booked (overlapping date + time + court)
- [ ] **Add class capacity enforcement** — prevent enrollment when `current_students >= max_students` with atomic DB check
- [ ] **Add customer self-service cancellation** — customers should be able to cancel their own bookings (with refund policy applied)
- [ ] **Add customer class unenrollment** — customers should be able to drop a class
- [ ] **Add booking approval/denial UI for admin** — admin dashboard needs approve/deny buttons on pending bookings
- [ ] **Add admin day-off / closure management** — CalendarOverview exists but needs full CRUD for schedule blocks
- [ ] **Add season management UI** — backend `/seasons` exists but no frontend page to manage seasons

### 2.2 Payments & Refunds

- [ ] **Implement actual email sending** — `email.py` router just prints to console; need SendGrid integration for:
  - [ ] Booking confirmation email
  - [ ] Payment receipt email
  - [ ] Password reset email
  - [ ] Welcome email on registration
  - [ ] Booking reminder (24 hours before)
- [ ] **Add admin refund UI** — admin should be able to initiate refunds (call Stripe refund API or mark offline payments as refunded)
- [ ] **Add customer payment history page** — `/customer/payments` or similar
- [ ] **Verify payment on checkout success page** — `/checkout/success` should fetch payment details from API and show receipt
- [ ] **Add receipt/invoice generation** — at minimum a printable receipt page
- [ ] **Add Stripe customer portal** — let customers manage their card on file

### 2.3 User Management

- [ ] **Add user profile update endpoint** — `PUT /users/me` for customers to update their own name, phone, email
- [ ] **Add change password endpoint** — `PUT /auth/change-password` (settings page has UI but no backend)
- [ ] **Add admin user management UI** — approve/suspend/activate users, view details, assign skill levels
- [ ] **Add user search/filter/pagination** on admin user list
- [ ] **Add admin notification creation** — send notifications to specific users or all users

### 2.4 Contact & Communication

- [ ] **Implement contact form backend** — `/contact` page shows success but doesn't actually send data anywhere. Need:
  - [ ] `POST /contact` endpoint to save message and/or email admin
  - [ ] Or integrate with chat messages table
- [ ] **Add chat reply functionality** — admin should be able to reply to chat messages (model has `reply_to` field but no endpoint/UI)
- [ ] **Add booking reminder notifications** — scheduled job to send email/SMS 24 hours before booking/class

---

## 3. 🟡 IMPORTANT — Should Fix Before Launch

### 3.1 Frontend Polish

- [ ] **Add React error boundary** — wrap pages in error boundaries so a crash doesn't take down the whole app
- [ ] **Add toast/notification system** — show success/error messages for API operations (currently failures are only `console.error`)
- [ ] **Add loading states/skeletons** to all data-fetching pages (classes, bookings, admin dashboard)
- [ ] **Add proper 404 page** — custom `not-found.tsx` with navigation back to home
- [ ] **Fix hardcoded calendar date** — `new Date(2026, 5, 1)` in admin calendar and customer dashboard should use `new Date()`
- [ ] **Fix `PaymentMethodSelector` empty `user_id`** — Stripe checkout session call passes `user_id: ''` which will fail
- [ ] **Fix auth redirect logic** — login page uses `localStorage` role instead of API response
- [ ] **Remove `pay_at_location` from payment methods** — it's listed but not relevant if Venmo/Zelle are primary
- [ ] **Add responsive design testing** — admin page is very wide; verify mobile layouts
- [ ] **Split large components** — `HomeClient.tsx` (715 lines) and `admin/page.tsx` (1082 lines) should be broken into sub-components
- [ ] **Add `loading.tsx` files** for Next.js streaming/suspense on each route segment
- [ ] **Wire up `useRealtime` hook** — exists but never imported; should be used for live notifications
- [ ] **Fix `ChatWidget` auth** — should attach user identity when logged in

### 3.2 Data & API

- [ ] **Add pagination to all list endpoints** — currently `bookings`, `classes`, `payments`, `chat_messages`, `notifications` return ALL records
- [ ] **Add database indexes** on frequently queried columns:
  - [ ] `court_bookings.date`, `court_bookings.court_number`, `court_bookings.status`
  - [ ] `payments.user_id`, `payments.status`, `payments.booking_id`
  - [ ] `notifications.user_id`, `notifications.read`
  - [ ] `class_enrollments.class_id`, `class_enrollments.user_id`
- [ ] **Add soft-delete filtering** — `deleted_at` columns exist but queries don't filter them out
- [ ] **Add audit logging** — record who approved/denied bookings, confirmed payments, changed skill levels
- [ ] **Fix `BookingCreate` schema** — missing `booking_id` and `enrollment_id` fields that the `Payment` model has
- [ ] **Fix `PaymentOut` schema** — includes `booking_id`, `enrollment_id`, `confirmed_by`, `confirmed_at` but `PaymentCreate` doesn't accept them
- [ ] **Add Alembic migration for new models** — `Season`, `PaymentPlan`, `PaymentPlanInstallment` need migration files
- [ ] **Add `Season` and `PaymentPlan` to Alembic imports** — `env.py` doesn't import them, so autogenerate won't detect them
- [ ] **Switch from SQLite to PostgreSQL** for production — SQLite doesn't handle concurrent writes well
- [ ] **Add database backup strategy** — pg_dump cron job or managed backup service
- [ ] **Add data retention/deletion policy** — purge old soft-deleted records, expired sessions, etc.

### 3.3 Legal & Compliance

- [ ] **Create Privacy Policy page** (`/privacy`)
- [ ] **Create Terms of Service page** (`/terms`)
- [ ] **Create Refund Policy page** (`/refund-policy`) — especially important given cash/check/Venmo/Zelle payments and 50% contract refund rule
- [ ] **Create Liability Waiver** — critical for a physical activity business (tennis)
- [ ] **Add GDPR/CCPA compliance**:
  - [ ] Data export endpoint (`GET /users/me/export`)
  - [ ] Data deletion endpoint (`DELETE /users/me`)
  - [ ] Cookie consent banner
  - [ ] Privacy policy link in footer
- [ ] **Link Terms & Privacy Policy** from registration page (checkbox exists but links nowhere)
- [ ] **Add cookie consent banner** — required for EU/CA visitors

### 3.4 SEO & Meta Tags

- [ ] **Add Open Graph meta tags** — `og:title`, `og:description`, `og:image`, `og:url` on every page
- [ ] **Add Twitter Card meta tags** — `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- [ ] **Add per-page `metadata` exports** — book, classes, customer, admin, etc. have no metadata
- [ ] **Create `robots.txt`** in `public/`
- [ ] **Create `sitemap.xml`** — generate dynamically or statically
- [ ] **Add JSON-LD structured data** — LocalBusiness, SportsActivityLocation schema on home page
- [ ] **Add canonical URLs** to all pages
- [ ] **Add favicon** — configure in `layout.tsx` (only `Logo.png` exists, no proper favicon)
- [ ] **Add meta description** to all pages

---

## 4. 🟡 IMPORTANT — Monitoring & Operations

### 4.1 Logging & Error Tracking

- [ ] **Configure Sentry DSN** for both frontend and backend — currently optional and not set
- [ ] **Add structured request logging** — log method, path, status, duration for every API request
- [ ] **Add frontend error tracking** — Sentry or equivalent for React errors
- [ ] **Add health check dependencies** — `/health` should verify database connectivity, not just return `{"status": "ok"}`
- [ ] **Set up uptime monitoring** — external service (UptimeRobot, Render cron, etc.) to ping health endpoint
- [ ] **Add application metrics** — Prometheus/OpenTelemetry or equivalent for response times, error rates

### 4.2 Performance

- [ ] **Optimize gallery images** — use Next.js `<Image>` component with responsive sizes instead of raw `<img>` tags
- [ ] **Add lazy loading** for below-fold content (videos, gallery, reviews)
- [ ] **Add API response caching** — HTTP cache headers or React Query/SWR for frequently accessed data
- [ ] **Fix N+1 queries** — `list_users` makes 2 extra queries per user (enrollments + bookings); use `joinedload`
- [ ] **Optimize calendar endpoint** — load by date range instead of loading ALL classes and bookings into memory
- [ ] **Add gzip/brotli compression middleware** to FastAPI
- [ ] **Add dynamic imports** for heavy pages (admin, booking, classes) to reduce initial bundle size
- [ ] **Configure CDN** for static assets (images, videos, fonts)
- [ ] **Add database connection pooling** — configure pool size, max overflow, connection recycling

---

## 5. 🟢 NICE-TO-HAVE — Post-Launch Improvements

### 5.1 Features

- [ ] **iCal export** — let users subscribe to their booking/class calendar
- [ ] **Admin data export** — CSV/Excel export for users, bookings, payments
- [ ] **Waitlist notification** — auto-notify waitlisted users when a class spot opens
- [ ] **Booking reminder notifications** — email/SMS 24 hours before
- [ ] **Class detail page** — `/classes/[id]` with full description, schedule, instructor info
- [ ] **Admin booking management page** — `/admin/bookings` with approve/deny, filters, search
- [ ] **Admin payment management page** — `/admin/payments` with confirm, refund, filter by method
- [ ] **Admin season management page** — `/admin/seasons` with CRUD for seasons
- [ ] **Customer profile page** — `/customer/profile` with editable fields
- [ ] **Payment history page** — `/customer/payments`
- [ ] **Notification preferences** — let users choose email/SMS/push notification settings
- [ ] **Dark mode** — toggle for accessibility
- [ ] **Multi-language support** — i18n if needed

### 5.2 Accessibility

- [ ] **Add skip-to-content link** for keyboard navigation
- [ ] **Add ARIA labels** on all interactive elements (carousel controls, payment selectors, tab buttons)
- [ ] **Fix color contrast** — green-200 on white fails WCAG AA
- [ ] **Add focus trapping** on modals (payment modal, forgot password modal)
- [ ] **Add `alt` text** on all images (some gallery images have generic alt)
- [ ] **Use `<label>` elements** instead of placeholder-only inputs
- [ ] **Add keyboard navigation** for carousels (arrow keys, escape to close)
- [ ] **Add screen reader announcements** for dynamic content changes (enrollment success, payment confirmation)
- [ ] **Add accessibility statement page**

### 5.3 Testing

- [ ] **Write backend unit tests** — at minimum: auth, booking creation, payment creation, refund logic
- [ ] **Write backend integration tests** — API endpoint tests with test database
- [ ] **Write frontend component tests** — at minimum: booking flow, payment selection, registration
- [ ] **Write E2E tests** — critical user flows (register → login → book → pay)
- [ ] **Set up CI/CD pipeline** — GitHub Actions or equivalent for automated testing on push
- [ ] **Add pre-commit hooks** — lint, format, type-check before commits

### 5.4 Code Quality

- [ ] **Add form validation library** — `react-hook-form` + `zod` for consistent validation
- [ ] **Fix type inconsistencies** — `BookingOut` vs `BookingCreate` field mismatches
- [ ] **Add `.dockerignore`** files for both frontend and backend
- [ ] **Document custom CSS classes** — `btn-primary`, `btn-secondary`, `btn-yellow`, `card`, `section-heading`, etc.
- [ ] **Set up Storybook** or component documentation
- [ ] **Add ESLint + Prettier** enforcement (if not already configured)
- [ ] **Add Husky pre-commit hooks** for linting

---

## 6. HARDCODED VALUES TO EXTERNALIZE

| Current Value | Location | Should Be |
|---|---|---|
| `"admin123"` / `"customer123"` | `backend/app/services/seed.py` | Random or env-var passwords |
| `"gina@ginastennisworld.com"` | `backend/app/services/seed.py` | Env var `ADMIN_EMAIL` |
| `908-464-9591` | `src/app/contact/page.tsx`, `src/components/Footer.tsx` | Config/env var |
| `"649 Springfield Ave, Berkeley Heights, NJ 07922"` | `PaymentMethodSelector.tsx`, contact page | Config |
| 3 courts (1 coming soon) | `src/app/book/page.tsx` | API-driven |
| `$28/$35/$45` per hour pricing | `src/app/book/page.tsx` | API-driven |
| `$10/hr` ball machine surcharge | `src/app/book/page.tsx` | API-driven |
| 20% evening surcharge after 7 PM | `src/app/book/page.tsx` | API-driven |
| 50% refund, 12-hour window | `backend/app/routers/bookings.py` | Config/env vars |
| `new Date(2026, 5, 1)` | Admin calendar, customer dashboard | `new Date()` |
| Demo quick-login credentials | `src/app/login/page.tsx` | **REMOVE** before production |

---

## 7. DATABASE MIGRATION CHECKLIST

Before deploying, run these migrations:

- [ ] Create Alembic migration for `Season` table
- [ ] Create Alembic migration for `PaymentPlan` table
- [ ] Create Alembic migration for `PaymentPlanInstallment` table
- [ ] Create Alembic migration for `Payment.booking_id` column
- [ ] Create Alembic migration for `Payment.enrollment_id` column
- [ ] Create Alembic migration for `Payment.confirmed_by` column
- [ ] Create Alembic migration for `Payment.confirmed_at` column
- [ ] Create Alembic migration for `Payment.deleted_at` column
- [ ] Create Alembic migration for `CourtBooking.deleted_at` column
- [ ] Create Alembic migration for `User.birth_date` column (if not exists)
- [ ] Create Alembic migration for `User.phone` column (if not exists)
- [ ] Add `Season` and `PaymentPlan` models to `alembic/env.py` imports
- [ ] Test all migrations on a clean database
- [ ] Back up production database before running migrations

---

## 8. PRE-LAUNCH VERIFICATION CHECKLIST

- [ ] All environment variables set in production (see Section 0)
- [ ] Database migrations run successfully
- [ ] Seed script run (`POST /auth/seed` or equivalent)
- [ ] Demo credentials removed from login page
- [ ] CORS origins set to production domain only
- [ ] Stripe webhook endpoint configured and tested
- [ ] Email sending tested (welcome email, booking confirmation)
- [ ] SMS sending tested (if Twilio configured)
- [ ] All API endpoints return proper error responses (no stack traces)
- [ ] All pages load without console errors
- [ ] Booking flow works end-to-end (create → pay → confirm)
- [ ] Payment flow works for Venmo/Zelle (create → admin confirms)
- [ ] Payment flow works for cash/check (create → shows reservation notice)
- [ ] Refund flow works (cancel contract booking → 50% refund)
- [ ] Admin can approve/deny bookings
- [ ] Admin can confirm offline payments
- [ ] Admin can send notifications
- [ ] Notification badge shows unread count
- [ ] Password reset flow works
- [ ] Mobile responsive on all pages
- [ ] Lighthouse score > 80 for Performance, Accessibility, Best Practices, SEO
- [ ] SSL certificate active and HSTS enabled
- [ ] DNS records configured correctly
- [ ] Uptime monitoring configured
- [ ] Error tracking (Sentry) configured and receiving errors
- [ ] Backup/restore procedure documented and tested

---

**Total items: ~150+**

> Start with Section 1 (Security) — it's the most critical. Then move to Section 2 (Missing Features), then Section 3 (Polish & Legal). Sections 4-5 can be done post-launch.