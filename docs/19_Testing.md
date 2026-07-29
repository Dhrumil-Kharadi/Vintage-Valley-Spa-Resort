# 19 — Testing

## Current State

The project **does not include a formal test suite**. There are no unit tests, integration tests, or end-to-end tests in the codebase. The `test` script in `Admin/package.json` simply echoes "No tests configured":

```json
"test": "echo \"No tests configured\" && exit 0"
```

---

## Existing Debug/Test Scripts

The `Backend/` directory contains several ad-hoc test scripts used during development:

| Script | Purpose |
|--------|---------|
| `test-ezee-api.js` | Tests eZee API connectivity and response parsing |
| `test_ezee_booking.js` | Tests eZee InsertBooking API with sample data |
| `test_smtp.js` | Tests SMTP email delivery |
| `fetch-all-data.js` | Fetches all eZee room data for inspection |
| `fetch-today-room-price.js` | Fetches current room prices from eZee |

These are **standalone Node.js scripts** (not test framework tests) meant to be run manually.

---

## Manual Testing Checklist

### Authentication
- [x] User can sign up with email/password
- [x] User can log in with existing credentials
- [x] Invalid credentials show appropriate error
- [x] Google OAuth sign-in works
- [x] Logout clears the cookie
- [x] Password reset email is sent
- [x] Password reset with valid token works
- [x] Password reset with expired token fails

### Room Browsing
- [x] Room listing loads with prices
- [x] Prices update when dates change
- [x] Fallback to cached data when eZee is down
- [x] Room details page displays correctly
- [x] Images load correctly
- [x] Amenities are displayed

### Booking Flow
- [x] Booking form validates required fields
- [x] Meal plan per-night selection works
- [x] Promo code validation works
- [x] Invalid promo code shows error
- [x] Price breakdown is accurate
- [x] Razorpay checkout opens correctly
- [x] Payment success confirms booking
- [x] Booking appears in user profile
- [x] Email with PDF invoice is received

### Admin Panel
- [x] Admin login works
- [x] All admin pages load correctly
- [x] Booking list displays with correct data
- [x] Manual booking creation succeeds
- [x] User list is populated
- [x] Payment details show enriched data
- [x] Promo CRUD operations work
- [x] Tariff editing saves correctly
- [x] Inquiries can be marked as read

---

## Recommended Test Strategy

### Unit Tests (Recommended: Vitest)

```bash
npm install -D vitest @vitest/coverage-v8
```

**Priority targets**:

| Module | What to Test |
|--------|-------------|
| `promoService.validateForBaseAmount` | Discount calculation, date range, night limits, weekend detection |
| `bookingService` (price calculation) | Base + extras + meal plans + GST + service fee |
| `ezee.service` (data mapping) | EzeeRoom parsing from various API response shapes |
| `razorpaySignature.ts` | HMAC-SHA256 verification |
| `jwt.ts` | Sign and verify round-trip |
| `cookies.ts` | Cookie options by environment |
| `mailer.ts` | SMTP config normalization, port/secure auto-adjustment |
| `errorHandler.ts` | HttpError, ZodError, and generic error formatting |

### Integration Tests

**Priority targets**:

| Flow | What to Test |
|------|-------------|
| Auth flow | Signup → login → me → logout |
| Booking creation | Full flow with mocked Razorpay and eZee |
| Promo application | Create promo → validate → apply to booking |
| Admin booking | Manual booking with mocked eZee |

### E2E Tests (Recommended: Playwright or Cypress)

| Flow | What to Test |
|------|-------------|
| Guest journey | Browse → select room → book → pay → confirm |
| Admin journey | Login → create manual booking → view bookings |
| Promo management | Create → apply → verify discount |

---

## Test Environment Configuration

```env
# .env.test
NODE_ENV=test
DATABASE_URL=mysql://root:pass@localhost:3306/vintage_valley_test
JWT_SECRET=test-secret-minimum-16-chars
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=test_secret
EZEE_BASE_URL=https://test.example.com
EZEE_HOTEL_CODE=00000
EZEE_API_KEY=test_key
```
