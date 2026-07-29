# 10 — Backend Documentation

## Controllers

### `authController.ts`
**Responsibilities**: User registration, login, logout, Google OAuth, password reset, profile update.  
**Validation Schemas**: `signupSchema`, `loginSchema`, `forgotSchema`, `resetSchema`, `updateProfileSchema` (all Zod).  
**Dependencies**: `authService`, `jwt`, `cookies`, `mailer`, `node-fetch`.

### `bookingController.ts`
**Responsibilities**: Create booking (with Razorpay), verify payment, list user bookings, retry payment, get invoice, delete pending.  
**Validation Schemas**: `createSchema` (roomId, dates, guests, meal plan, promo), `verifySchema` (Razorpay IDs).  
**Dependencies**: `bookingService`, `razorpaySignature`, `env`.

### `adminController.ts`
**Responsibilities**: List users/rooms/bookings/payments, new bookings count, create manual booking, delete booking.  
**Key Feature**: Manual booking creates a CONFIRMED booking with OFFLINE payment and pushes to eZee.  
**Dependencies**: `adminService`, Zod.

### `roomController.ts`
**Responsibilities**: Room listing with live eZee prices, raw listing, single room, prices, Lotus availability.  
**Key Logic**: `extractPricePerNight()` — prioritizes `day_wise_beforediscount` > `avg_per_night_after_discount` > `totalprice_inclusive_all` > `exclusive_tax` > `rack_rate` > `avg_price_per_night`.  
**Fallback**: eZee API failure → RoomCache → hardcoded static rooms.  
**Dependencies**: `ezeeService`, `roomService`, `prisma`.

### `roomLivePrice.controller.ts`
**Responsibilities**: Live price fetching, DB sync, scheduler management.  
**Dependencies**: `ezeeLivePriceService`, `roomPriceSyncService`, `priceSyncScheduler`.

### `promoController.ts`
**Responsibilities**: Promo validation, CRUD for code-based promos.  
**Dependencies**: `promoService`.

### `promoAdminController.ts`
**Responsibilities**: Global flat promo CRUD. Ensures only one global flat promo is active at a time.  
**Dependencies**: `prisma` (direct access).

### `inquiryController.ts`
**Responsibilities**: Create inquiry (public), list/count/mark-read (admin).  
**Dependencies**: `inquiryService`.

### `tariffController.ts`
**Responsibilities**: Get tariffs (seeds defaults if empty), update tariff.  
**Note**: Creates its own PrismaClient instance (not shared singleton).

---

## Services

### `authService.ts`
| Method | Purpose |
|--------|---------|
| `signup({name, email, password, phone})` | bcrypt hash + create user |
| `login({email, password})` | Find user + bcrypt compare |
| `findOrCreateFromGoogle({email, name})` | Upsert for OAuth users |
| `me(userId)` | Fetch user by ID |
| `createResetToken(email)` | Generate SHA-256 hashed token |
| `resetPassword({token, newPassword})` | Verify + update in transaction |
| `updateProfile(userId, {name, phone, password})` | Partial update |

### `bookingService.ts` (1066 lines — core module)
| Method | Purpose |
|--------|---------|
| `createBooking(params)` | Full booking creation: validate dates → fetch eZee prices → match room type → calculate per-night with meal plans → apply promo/global discount → GST (5%) + service fee (2%) → create Razorpay order → save booking + payment |
| `markPaymentVerified(params)` | Verify signature → fetch raw eZee rooms → find matching variant → push to eZee PMS → update DB → generate PDF → send emails |
| `retryPaymentForPendingBooking(params)` | Create new Razorpay order for existing PENDING booking |
| `deleteUserPendingBooking(params)` | Delete PENDING booking (ownership verified) |
| `listUserBookings(params)` | List user's bookings with room info |
| `getUserInvoiceData(params)` | Fetch booking data for invoice |
| `getTotalBookingsCount()` | Count bookings from last 4 days |
| `allocateNextBookingNo(tx)` | Atomic sequential number from BookingCounter |
| `getActiveGlobalFlatPromo()` | Find active GLOBAL_FLAT promo |
| `applyGlobalFlatDiscount(baseAmount, promo)` | Calculate flat discount |

### `adminService.ts` (872 lines)
Similar to bookingService but for admin/staff manual bookings. Key differences:
- Payment is OFFLINE (CASH/UPI/CARD)
- Booking status is immediately CONFIRMED
- Uses fixed rates for child (₹1200/night) and extra adult (₹1500/night) charges
- Sends confirmation email with PDF invoice to both guest and hotel owner

### `ezee.service.ts`
| Method | Purpose |
|--------|---------|
| `fetchRoomList(params)` | Fetches rooms from eZee listing API, normalizes to `EzeeRoom[]` type |
| `fetchRoomListRaw(params)` | Returns raw eZee response (all variants including EP/CP/MAP/AP) |

**API Endpoint**: `{EZEE_BASE_URL}/booking/reservation_api/listing.php`  
**Error Mapping**: Maps eZee error codes to HTTP errors (HotelCodeEmpty→400, UNAUTHREQ→401, NightsLimitExceeded→400, DateNotvalid→400).

### `ezeeBooking.service.ts`
**Purpose**: Push confirmed bookings to eZee PMS via InsertBooking API.  
**Method**: `createAndConfirmBooking(params)` — constructs eZee XML/JSON payload with room type IDs, guest details, dates, and payment info.

### `ezeeLivePrice.service.ts`
**Purpose**: Alternative live price fetching service with simplified output.

### `roomPriceSync.service.ts`
**Purpose**: Syncs live eZee prices to the `Room` table in the database.  
**Method**: `syncPricesToDatabase()` — matches eZee rooms by title to DB rooms, updates `pricePerNight`, `epPricePerNight`, `cpPricePerNight`, `mapPricePerNight`, `availableRooms`.

### `priceSyncScheduler.service.ts`
**Purpose**: Interval-based auto-sync scheduler using `setInterval`.  
**Methods**: `start(intervalMinutes)`, `stop()`, `getStatus()`.

### `promoService.ts`
| Method | Purpose |
|--------|---------|
| `validateForBaseAmount(params)` | Full validation: code exists + active + date range + max uses + night range + weekend check → calculate discount |
| `listAdmin()` | List all promos for admin |
| `createAdmin(params)` | Create new promo with all settings |
| `removeAdmin({id})` | Delete promo |
| `updateAdmin(params)` | Update promo settings |
| `setActiveAdmin({id, isActive})` | Toggle active state |

**Weekend Detection**: Checks if stay includes Friday or Saturday night using JavaScript `Date.getDay()`.

### `inquiryService.ts`
Basic CRUD: `createInquiry`, `listInquiries`, `unreadCount`, `markRead`.

### `roomService.ts`
Simple wrapper: `getById(id)` → `prisma.room.findUnique` with images and amenities.

---

## Middlewares

### `auth.ts`
Three exported functions: `requireAuth`, `requireAdmin`, `requireAdminOrStaff`.  
Uses JWT from cookie, attaches `req.user` with `userId` and `role`.

### `errorHandler.ts`
Global Express error handler. Handles:
1. `HttpError` → status code + message
2. `ZodError` → 400 with first issue message
3. Generic errors → 500 (stack trace in dev, hidden in prod)

### `notFoundHandler.ts`
Catch-all 404 handler: returns `{ok: false, error: {message: "Route not found: METHOD /path"}}`.

---

## Utilities

### `asyncHandler.ts`
Wraps async Express handlers to catch rejections and forward to error middleware.

### `jwt.ts`
- `signAccessToken(payload)` — Signs JWT with `env.JWT_SECRET` and `env.JWT_EXPIRES_IN`
- `verifyAccessToken(token)` — Verifies and returns `JwtPayload`

### `cookies.ts`
- `getAuthCookieOptions()` — Returns cookie config based on environment
- `setAuthCookie(res, token)` — Sets the JWT cookie
- `clearAuthCookie(res)` — Clears the JWT cookie

### `razorpay.ts`
Factory function `getRazorpayClient()` — returns `null` if keys not configured.

### `razorpaySignature.ts`
`verifyRazorpaySignature({orderId, paymentId, signature})` — HMAC-SHA256 verification of Razorpay payment.

### `mailer.ts`
`sendMailSafe(params)` — Sends email via SMTP with:
- Configurable host/port/user/pass
- Auto-adjustment: port 587 → secure=false, port 465 → secure=true
- Gmail fallback: if port 587 fails, retry on 465 with SSL
- Supports attachments (PDF invoices)
- Never throws — logs errors silently

### `invoicePdf.ts`
`generateBookingInvoicePdfBuffer(booking)` — Generates PDF invoice using jsPDF with booking details, price breakdown, and hotel branding.
