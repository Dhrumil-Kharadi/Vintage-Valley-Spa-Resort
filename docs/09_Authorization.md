# 09 — Authorization

## Role-Based Access Control (RBAC)

The application uses a three-role system defined in the Prisma schema:

```prisma
enum Role {
  USER    // Regular guest
  ADMIN   // Full administrative access
  STAFF   // Hotel staff — same access as ADMIN for most operations
}
```

---

## Middleware Implementation

Authorization is enforced through three middleware functions in `Backend/src/middlewares/auth.ts`:

### `requireAuth`
Extracts and verifies the JWT from the `token` cookie. Attaches `req.user = { userId, role }`.

```typescript
export const requireAuth = (req, _res, next) => {
  const token = req.cookies?.[env.JWT_COOKIE_NAME];
  if (!token) return next(new HttpError(401, "Unauthorized"));
  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return next(new HttpError(401, "Unauthorized"));
  }
};
```

### `requireAdmin`
Requires `role === "ADMIN"`. Only the ADMIN role passes.

### `requireAdminOrStaff`
Requires `role === "ADMIN"` or `role === "STAFF"`. Both privileged roles pass.

---

## Route Protection Matrix

### Backend API (`/api`)

| Route | Auth | Role | Middleware |
|-------|------|------|-----------|
| `POST /api/auth/signup` | ❌ | Any | — |
| `POST /api/auth/login` | ❌ | Any | — |
| `POST /api/auth/logout` | ❌ | Any | — |
| `GET /api/auth/google` | ❌ | Any | — |
| `GET /api/auth/google/callback` | ❌ | Any | — |
| `POST /api/auth/forgot-password` | ❌ | Any | — |
| `POST /api/auth/reset-password` | ❌ | Any | — |
| `GET /api/auth/me` | ✅ | Any | `requireAuth` |
| `PUT /api/auth/me` | ✅ | Any | `requireAuth` |
| `GET /api/rooms/*` | ❌ | Any | — |
| `GET /api/rooms-live/*` | ❌ | Any | — |
| `POST /api/rooms-live/*` | ❌ | Any | — |
| `POST /api/inquiries/` | ❌ | Any | — |
| `POST /api/promos/validate` | ❌ | Any | — |
| `GET /api/promos/` | ❌ | Any | — |
| `GET /api/tariff/` | ❌ | Any | — |
| `PUT /api/tariff/:id` | ❌ | Any | — (⚠️ unprotected) |
| `GET /api/bookings/` | ✅ | Any | `requireAuth` |
| `GET /api/bookings/me` | ✅ | Any | `requireAuth` |
| `GET /api/bookings/total-count` | ✅ | Any | `requireAuth` |
| `POST /api/bookings/` | ✅ | Any | `requireAuth` |
| `POST /api/bookings/:id/verify` | ✅ | Any | `requireAuth` |
| `POST /api/bookings/:id/retry-payment` | ✅ | Any | `requireAuth` |
| `DELETE /api/bookings/:id` | ✅ | Any | `requireAuth` |
| `GET /api/bookings/:id/invoice` | ✅ | Any | `requireAuth` |
| `GET /api/admin/*` | ✅ | ADMIN/STAFF | `requireAuth` + `requireAdminOrStaff` |
| `POST /api/admin/*` | ✅ | ADMIN/STAFF | `requireAuth` + `requireAdminOrStaff` |
| `DELETE /api/admin/*` | ✅ | ADMIN/STAFF | `requireAuth` + `requireAdminOrStaff` |
| `POST /api/promos/` (create) | ✅ | ADMIN/STAFF | `requireAuth` + `requireAdminOrStaff` |
| `PATCH /api/promos/:id` | ✅ | ADMIN/STAFF | `requireAuth` + `requireAdminOrStaff` |
| `DELETE /api/promos/:id` | ✅ | ADMIN/STAFF | `requireAuth` + `requireAdminOrStaff` |
| `GET /api/admin/promos/*` | ✅ | ADMIN/STAFF | `requireAuth` + `authorize(['ADMIN','STAFF'])` |

### Admin API (`/admin-api`)

| Route | Auth | Role | Middleware |
|-------|------|------|-----------|
| `POST /admin-api/auth/login` | ❌ | Any | — |
| `POST /admin-api/auth/signup` | ❌ | Any | — |
| `GET /admin-api/auth/me` | ✅ | Any | `requireAuth` |
| `POST /admin-api/auth/forgot-password` | ❌ | Any | — |
| `POST /admin-api/auth/reset-password` | ❌ | Any | — |
| `GET /admin-api/bookings` | ✅ | Any | `requireAuth` |
| `GET /admin-api/users` | ✅ | Any | `requireAuth` |
| `GET /admin-api/rooms` | ✅ | Any | `requireAuth` |
| `DELETE /admin-api/bookings/:id` | ✅ | Any | `requireAuth` |
| `PUT /admin-api/rooms/:id` | ✅ | ADMIN/STAFF | `requireAuth` + `requireAdminOrStaff` |
| `GET /admin-api/promos/*` | ✅ | ADMIN/STAFF | `requireAuth` + `requireAdminOrStaff` |
| `POST /admin-api/promos` | ✅ | ADMIN/STAFF | `requireAuth` + `requireAdminOrStaff` |
| `PATCH /admin-api/promos/:id` | ✅ | ADMIN/STAFF | `requireAuth` + `requireAdminOrStaff` |
| `DELETE /admin-api/promos/:id` | ✅ | ADMIN/STAFF | `requireAuth` + `requireAdminOrStaff` |

---

## Service-Level Authorization

Beyond middleware, some services enforce ownership:

| Check | Location | Rule |
|-------|----------|------|
| Booking ownership | `bookingService.deleteUserPendingBooking` | `booking.userId !== params.userId` → 403 |
| Booking ownership | `bookingService.markPaymentVerified` | `booking.userId !== params.userId` → 403 |
| Booking ownership | `bookingService.retryPaymentForPendingBooking` | `booking.userId !== params.userId` → 403 |
| Booking status | `bookingService.deleteUserPendingBooking` | Only PENDING bookings can be deleted |
| Booking status | `bookingService.retryPaymentForPendingBooking` | Only PENDING bookings can be retried |

---

## Frontend Route Guards

The frontend does **not** implement route guards in the router. Instead:

1. Admin pages (e.g., `AdminBookings.tsx`) fetch `/api/auth/me` on mount.
2. If the response indicates non-admin role or unauthenticated, the page redirects to `/admin/login`.
3. The `AdminLayout` component handles this check pattern.

> **Note**: This is a client-side-only check. The real security is in the backend middleware. The frontend guard is for UX only.

---

## Security Observations

| Concern | Status | Notes |
|---------|--------|-------|
| JWT in HTTP-only cookie | ✅ Safe | Not accessible via XSS |
| No token blacklist | ⚠️ Trade-off | Logout doesn't invalidate JWT server-side |
| `PUT /api/tariff/:id` unprotected | 🔴 Issue | Any request can update tariffs |
| Admin data routes loosely protected | ⚠️ Note | Some `/admin-api` data routes only require auth, not admin role |
| No IP-based restrictions | ℹ️ Info | All routes accessible from any IP |
