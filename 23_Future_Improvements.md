# 23 — Future Improvements

## Security Enhancements

### 🔴 Critical

| Issue | Current State | Recommendation |
|-------|--------------|----------------|
| **Tariff endpoint unprotected** | `PUT /api/tariff/:id` has no auth middleware | Add `requireAuth` + `requireAdminOrStaff` middleware |
| **No JWT blacklist** | Logout only clears cookie; JWT valid until expiry | Implement Redis-backed token blacklist or short-lived tokens with refresh token rotation |
| **No Helmet headers** | No `X-Content-Type-Options`, `X-Frame-Options`, etc. | Add `helmet` middleware to Backend and Admin servers |

### 🟡 Important

| Issue | Recommendation |
|-------|----------------|
| No per-endpoint rate limiting | Add stricter rate limits on `/api/auth/login` (prevent brute force) and `/api/bookings` |
| Admin data routes loosely protected | Some `/admin-api` data routes only check `requireAuth` — add role check |
| No CSRF tokens for form submissions | Consider adding CSRF tokens for non-GET requests |
| No API key authentication for external consumers | Implement API key system if third-party access needed |

---

## Architecture Improvements

### Backend Refactoring

| Area | Current | Suggested |
|------|---------|-----------|
| **Monolithic services** | `bookingService.ts` (1066 lines), `adminService.ts` (872 lines) | Split into focused modules: `PriceCalculator`, `EzeeRoomMatcher`, `BookingEmailSender` |
| **Duplicate eZee logic** | Similar room-matching code in `bookingService` and `adminService` | Extract to shared `EzeeRoomResolver` service |
| **Inline email templates** | HTML templates hardcoded in service files | Move to template files (Handlebars/EJS) or a dedicated email template service |
| **Console logging** | `console.log` / `console.error` everywhere | Adopt a structured logger (Winston/Pino) with log levels and file rotation |
| **Admin server coupling** | Admin imports Backend middlewares via relative paths | Create a shared package (`@vintage-valley/shared`) or monorepo workspace |
| **Tariff controller** | Creates its own PrismaClient instead of using shared singleton | Use the shared `prisma` import from `../prisma/client` |

### Frontend Refactoring

| Area | Current | Suggested |
|------|---------|-----------|
| **Page file sizes** | `booking.tsx` (87K), `AdminBookings.tsx` (86K) | Break into smaller components: `BookingForm`, `BookingPriceSummary`, `BookingConfirmation` |
| **API calls in pages** | Inline `axios.get()` in `useEffect` | Create API service modules and use React Query hooks consistently |
| **No global state** | Each page manages its own auth state | Add a global auth context or Zustand store |
| **No error boundaries** | Unhandled errors show blank screen | Add React error boundaries at page and layout level |
| **Hardcoded API URLs** | Some pages use `/api/...` directly | Centralize in API service files |
| **Static room data** | `roomsData.ts` duplicates seed data | Consider fetching from API-only or using database as source of truth |

---

## Feature Improvements

### Booking Enhancements

| Feature | Description |
|---------|-------------|
| **Booking cancellation** | Allow guests to cancel confirmed bookings (with refund policy) |
| **Booking modification** | Allow date/room changes for upcoming bookings |
| **Multiple payment support** | Support partial payments, split payments |
| **Booking reminders** | Email reminders before check-in date |
| **Review system** | Allow guests to review their stay post-checkout |
| **Waitlist** | When rooms are unavailable, allow guests to join a waitlist |

### Admin Enhancements

| Feature | Description |
|---------|-------------|
| **Dashboard analytics** | Revenue charts, occupancy rates, booking trends |
| **Export functionality** | Export bookings/users/payments to CSV/Excel |
| **Check-in/check-out tracking** | Mark guests as checked in/out |
| **Room availability calendar** | Visual calendar showing room occupancy |
| **Staff activity log** | Audit trail for admin actions |
| **Multi-property support** | Manage multiple hotel properties |

### Guest Experience

| Feature | Description |
|---------|-------------|
| **Email verification** | Verify email on registration |
| **Booking confirmation page** | Dedicated confirmation page (not just toast) |
| **Multi-language support** | i18n for international guests |
| **Room comparison** | Side-by-side room comparison feature |
| **Saved favorites** | Save rooms to favorites list |
| **Guest review display** | Show reviews on room pages |

---

## Infrastructure Improvements

### DevOps

| Area | Recommendation |
|------|----------------|
| **CI/CD pipeline** | Add GitHub Actions for automated testing and deployment |
| **Docker containerization** | Dockerize Backend, Admin, Frontend for consistent environments |
| **Health monitoring** | Add uptime monitoring (PM2 + external service) |
| **Database backups** | Automated MySQL backups with retention policy |
| **Environment management** | Use `.env` management tool (e.g., `dotenv-vault`) |

### Performance

| Area | Recommendation |
|------|----------------|
| **API caching** | Cache eZee responses in Redis (TTL: 5-15 min) |
| **Database indexing** | Add composite indexes on frequently queried columns |
| **Image optimization** | Implement image CDN with automatic resizing (Cloudflare Images, Cloudinary) |
| **Frontend code splitting** | Lazy-load admin pages and large components |
| **API response compression** | Enable gzip/brotli compression in Express |

### Scalability

| Area | Recommendation |
|------|----------------|
| **File uploads** | Add image upload API with cloud storage (S3/GCS) |
| **Connection pooling** | Configure Prisma connection pool for production load |
| **Horizontal scaling** | Move from PM2 single-instance to load-balanced deployment |
| **Message queues** | Use message queue (BullMQ/RabbitMQ) for email sending and eZee sync |
| **WebSocket notifications** | Real-time booking notifications for admin panel |

---

## Testing Improvements

| Area | Recommendation |
|------|----------------|
| **Unit test suite** | Add Vitest tests for all services (especially pricing logic) |
| **Integration tests** | Test API endpoints with supertest and test database |
| **E2E tests** | Add Playwright tests for critical user flows |
| **CI test automation** | Run tests on every pull request |
| **Code coverage** | Track and enforce minimum coverage thresholds |
| **Load testing** | Test with k6 or Artillery for production traffic simulation |

---

## Database Improvements

| Area | Recommendation |
|------|----------------|
| **Soft deletes** | Add `deletedAt` column instead of hard deletes for bookings |
| **Audit logging** | Track who changed what and when (audit trail table) |
| **Migrations** | Switch from `prisma db push` to `prisma migrate` for production safety |
| **Database seeder** | Convert seed.js to TypeScript, add more comprehensive seed data |
| **Data archival** | Archive old bookings to a separate table for performance |

---

## Priority Matrix

| Priority | Items |
|----------|-------|
| 🔴 **P0 — Do Now** | Fix unprotected tariff endpoint, add Helmet headers |
| 🟡 **P1 — Next Sprint** | Add login rate limiting, error boundaries, structured logging |
| 🟢 **P2 — Near Term** | Split large files, add unit tests, Docker setup |
| 🔵 **P3 — Medium Term** | CI/CD, image uploads, booking cancellation |
| ⚪ **P4 — Long Term** | Multi-language, analytics dashboard, WebSocket notifications |
