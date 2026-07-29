# 07 — API Documentation

All API responses follow the format `{ ok: boolean, data?: object, error?: { message: string } }`.

Base URL: `/api` (Backend, port 5050) · `/admin-api` (Admin, port 5051)

---

## Authentication APIs (`/api/auth`)

### POST `/api/auth/signup`
**Purpose**: Register a new user account.  
**Auth**: None  
**Request Body**:
```json
{ "name": "John Doe", "email": "john@example.com", "password": "secret123", "phone": "9876543210" }
```
**Validation**: name (min 1), email (valid email), password (min 6), phone (optional)  
**Response** `200`: `{ ok: true, data: { user: { id, name, email, phone, role } } }` + Set-Cookie: token  
**Errors**: `409` Email already registered · `400` Validation error  
**Service**: `authService.signup` → bcrypt hash → create User → sign JWT

---

### POST `/api/auth/login`
**Purpose**: Authenticate and receive a JWT cookie.  
**Auth**: None  
**Request Body**: `{ "email": "john@example.com", "password": "secret123" }`  
**Validation**: email (valid), password (min 1)  
**Response** `200`: `{ ok: true, data: { user: { id, name, email, phone, role } } }` + Set-Cookie: token  
**Errors**: `401` Invalid credentials  
**Service**: `authService.login` → bcrypt compare

---

### POST `/api/auth/logout`
**Purpose**: Clear the auth cookie.  
**Auth**: None  
**Response** `200`: `{ ok: true }` + Clear-Cookie

---

### GET `/api/auth/google`
**Purpose**: Initiate Google OAuth 2.0 flow.  
**Auth**: None  
**Query**: `?redirect=/booking` (optional post-login redirect path)  
**Response**: `302` Redirect to Google consent screen  
**Cookies set**: `oauth_state`, `oauth_redirect` (10 min TTL)

---

### GET `/api/auth/google/callback`
**Purpose**: Handle Google OAuth callback, create/find user, set cookie.  
**Auth**: None  
**Query**: `?code=...&state=...`  
**Response**: `302` Redirect to `CLIENT_URL + redirect`  
**Errors**: Redirect to `CLIENT_URL/login?oauth=failed` on any error

---

### GET `/api/auth/me`
**Purpose**: Get current authenticated user.  
**Auth**: Required (JWT cookie)  
**Response** `200`: `{ ok: true, data: { user: { id, name, email, phone, role } } }`

---

### PUT `/api/auth/me`
**Purpose**: Update current user's profile.  
**Auth**: Required  
**Request Body**: `{ "name": "New Name", "phone": "123", "password": "newpass" }` (all optional)  
**Response** `200`: `{ ok: true, data: { user } }`

---

### POST `/api/auth/forgot-password`
**Purpose**: Request password reset email (admin only — sends to hotel email).  
**Auth**: None  
**Request Body**: `{ "email": "admin@hotel.com" }`  
**Response** `200`: `{ ok: true, data: { resetToken: null } }`  
**Note**: Always returns success (doesn't reveal if email exists). Token sent via SMTP to `vintagevalleyresort@gmail.com`.

---

### POST `/api/auth/reset-password`
**Purpose**: Reset password using token from email.  
**Auth**: None  
**Request Body**: `{ "token": "raw-hex-token", "newPassword": "newpass123" }`  
**Response** `200`: `{ ok: true }`  
**Errors**: `400` Invalid or expired token

---

## Booking APIs (`/api/bookings`)

All require authentication.

### GET `/api/bookings/` or `/api/bookings/me`
**Purpose**: List current user's bookings.  
**Auth**: Required  
**Response** `200`: `{ ok: true, data: { bookings: [...] } }`  
**Includes**: room (id, title)

---

### GET `/api/bookings/total-count`
**Purpose**: Count bookings created in last 4 days.  
**Auth**: Required  
**Response** `200`: `{ ok: true, data: { totalBookings: 42 } }`

---

### POST `/api/bookings/`
**Purpose**: Create a new booking with Razorpay order.  
**Auth**: Required  
**Request Body**:
```json
{
  "roomId": 1,
  "checkIn": "2026-08-01",
  "checkOut": "2026-08-03",
  "checkInTime": "14:00",
  "checkOutTime": "11:00",
  "rooms": 1,
  "guests": 2,
  "adults": 2,
  "children": 0,
  "extraAdults": 0,
  "additionalInformation": "Late check-in",
  "promoCode": "SUMMER10",
  "mealPlanByDate": [
    { "date": "2026-08-01", "plan": "CP" },
    { "date": "2026-08-02", "plan": "EP" }
  ],
  "totalAmount": 10500.00
}
```
**Response** `200`:
```json
{
  "ok": true,
  "data": {
    "booking": { "id": "...", "bookingNo": 42, "status": "PENDING", ... },
    "razorpay": {
      "keyId": "rzp_test_xxx",
      "orderId": "order_xxx",
      "amount": 1050000,
      "currency": "INR"
    }
  }
}
```
**Business Logic**: Fetches eZee live prices → calculates base + extras + promo + GST (5%) + service fee (2%) → creates Razorpay order → saves PENDING booking + CREATED payment.

---

### POST `/api/bookings/:id/verify`
**Purpose**: Verify Razorpay payment and confirm booking in eZee PMS.  
**Auth**: Required  
**Request Body**: `{ "razorpayOrderId": "...", "razorpayPaymentId": "...", "razorpaySignature": "..." }`  
**Response** `200`: `{ ok: true, data: { booking, payment } }`  
**Business Logic**: HMAC-SHA256 verify → fetch eZee raw rooms → find matching variant → `InsertBooking` to eZee → update DB to CONFIRMED + PAID → generate PDF → send email.

---

### POST `/api/bookings/:id/retry-payment`
**Purpose**: Create a new Razorpay order for a PENDING booking.  
**Auth**: Required  
**Response** `200`: `{ ok: true, data: { razorpay: { keyId, orderId, amount, currency } } }`

---

### DELETE `/api/bookings/:id`
**Purpose**: Delete a PENDING booking.  
**Auth**: Required (must be booking owner)  
**Response** `200`: `{ ok: true, data: { id } }`

---

### GET `/api/bookings/:id/invoice`
**Purpose**: Get booking data for client-side invoice rendering.  
**Auth**: Required (must be booking owner)  
**Response** `200`: `{ ok: true, data: { booking: { ... } } }`

---

## Room APIs (`/api/rooms`)

### GET `/api/rooms/`
**Purpose**: List all rooms with live eZee prices, global promo applied.  
**Auth**: None (public)  
**Query Parameters**: `checkIn`, `checkOut`, `adults`, `children`, `rooms`  
**Response** `200`: `{ ok: true, data: { rooms: [...] }, meta?: { cached, fallback } }`  
**Fallback Strategy**: eZee API → RoomCache → Static fallback data  
**Caching**: Upserts to `rooms_cache` table on every successful eZee call.

---

### GET `/api/rooms/raw`
**Purpose**: Get raw eZee API response (all room variants).  
**Auth**: None  
**Query Parameters**: same as above  
**Response** `200`: `{ success: true, rooms: [...] }`

---

### GET `/api/rooms/prices`
**Purpose**: Get room prices summary.  
**Auth**: None  
**Response** `200`: `{ success: true, rooms: [{ roomType, price, currency, availability }] }`

---

### GET `/api/rooms/:id`
**Purpose**: Get single room details from database.  
**Auth**: None  
**Response** `200`: `{ ok: true, id, title, description, pricePerNight, amenities, images, ... }`

---

### GET `/api/rooms/lotus-availability`
**Purpose**: Check Lotus Family Suite availability via eZee Kiosk API.  
**Auth**: None  
**Query**: `checkIn`, `checkOut`  
**Response** `200`: `{ success: true, available: true, availableCount: 5, ... }`

---

## Live Price APIs (`/api/rooms-live`)

### GET `/api/rooms-live/`
**Purpose**: Fetch live prices from eZee with optional DB sync.  
**Query**: `checkIn`, `checkOut`, `adults`, `children`, `rooms`, `syncToDb=true`  
**Response** `200`: `{ success: true, rooms: [...], syncUpdates?: N }`

### POST `/api/rooms-live/sync`
**Purpose**: Manually trigger price sync to Room table.  
**Response** `200`: `{ success: true, updates: [...] }`

### GET `/api/rooms-live/database`
**Purpose**: Get prices stored in Room table.  
**Response** `200`: `{ success: true, rooms: [...] }`

### POST `/api/rooms-live/scheduler/start`
**Purpose**: Start auto-sync scheduler.  
**Body**: `{ "intervalMinutes": 60 }`

### POST `/api/rooms-live/scheduler/stop`
**Purpose**: Stop auto-sync scheduler.

### GET `/api/rooms-live/scheduler/status`
**Purpose**: Check scheduler running state.

---

## Promo APIs (`/api/promos`)

### POST `/api/promos/validate`
**Purpose**: Validate a promo code and calculate discount.  
**Auth**: None  
**Request Body**: `{ "code": "SUMMER10", "baseAmount": 9000, "nights": 2, "checkIn": "...", "checkOut": "..." }`  
**Response** `200`: `{ ok: true, data: { promo: { code, type, value }, discountAmount: 900 } }`

### GET `/api/promos/`
**Purpose**: List all promo codes (admin view).  
**Auth**: None  

### POST `/api/promos/`
**Purpose**: Create promo code.  
**Auth**: Admin/Staff  

### PATCH `/api/promos/:id`
**Purpose**: Update promo code.  
**Auth**: Admin/Staff  

### PATCH `/api/promos/:id/active`
**Purpose**: Toggle promo active state.  
**Auth**: Admin/Staff  

### DELETE `/api/promos/:id`
**Purpose**: Delete promo code.  
**Auth**: Admin/Staff  

---

## Admin APIs (`/api/admin`)

All require auth + ADMIN or STAFF role.

### GET `/api/admin/users` — List all users
### GET `/api/admin/rooms` — List all rooms with images/amenities
### GET `/api/admin/bookings` — List all bookings with user, room, payments
### POST `/api/admin/bookings/new-count` — Count bookings since timestamp
### POST `/api/admin/bookings/manual` — Create manual booking (walk-in)
### DELETE `/api/admin/bookings/:id` — Delete any booking
### GET `/api/admin/payments` — List all payments (enriched from Razorpay)
### GET `/api/admin/inquiries` — List all inquiries
### GET `/api/admin/inquiries/unread-count` — Count unread inquiries
### PATCH `/api/admin/inquiries/:id/read` — Mark inquiry as read

---

## Inquiry APIs (`/api/inquiries`)

### POST `/api/inquiries/`
**Purpose**: Submit a contact form inquiry.  
**Auth**: None (public)  
**Request Body**: `{ "name": "Jane", "email": "jane@mail.com", "phone": "123", "message": "Hi" }`

---

## Tariff APIs (`/api/tariff`)

### GET `/api/tariff/` — Get all tariffs (seeds defaults if empty)
### PUT `/api/tariff/:id` — Update tariff entry

---

## Admin Panel APIs (`/admin-api`)

### POST `/admin-api/auth/login` — Admin login
### POST `/admin-api/auth/signup` — Admin signup (restricted)
### GET `/admin-api/auth/me` — Current admin user
### POST `/admin-api/auth/forgot-password` — Request reset
### POST `/admin-api/auth/reset-password` — Execute reset
### GET `/admin-api/bookings` — List bookings (protected)
### GET `/admin-api/users` — List users (protected)
### GET `/admin-api/rooms` — List rooms (protected)
### DELETE `/admin-api/bookings/:id` — Delete booking (protected)
### PUT `/admin-api/rooms/:id` — Update room (admin/staff)
### GET `/admin-api/promos` — List promos (admin/staff)
### POST `/admin-api/promos` — Create promo (admin/staff)
### PATCH `/admin-api/promos/:id` — Update promo (admin/staff)
### DELETE `/admin-api/promos/:id` — Delete promo (admin/staff)

---

## Health Check

### GET `/` — `{ message: "Vintage Backend Running 🚀" }`
### GET `/api/health` — `{ ok: true }`

---

## Common Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad request / validation error |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (insufficient role) |
| `404` | Resource not found |
| `409` | Conflict (duplicate email/promo code) |
| `500` | Internal server error |
| `502` | Bad gateway (eZee API failure) |
