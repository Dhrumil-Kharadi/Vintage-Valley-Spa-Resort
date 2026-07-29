# 16 — Security

## Authentication Security

### Password Storage
- **Algorithm**: bcrypt
- **Cost Factor**: 10 (2^10 = 1024 iterations)
- **Implementation**: `bcryptjs` library
- Passwords are **never** stored in plain text or reversible encryption

### JWT Tokens
| Property | Value |
|----------|-------|
| Algorithm | HS256 (HMAC-SHA256) |
| Secret | `JWT_SECRET` env var (min 16 chars enforced by Zod) |
| Expiration | Configurable via `JWT_EXPIRES_IN` (default: 7 days) |
| Storage | HTTP-only cookie |
| Payload | `{ userId: string, role: "USER" | "ADMIN" | "STAFF" }` |

### Cookie Security

| Flag | Development | Production |
|------|------------|------------|
| `httpOnly` | ✅ | ✅ |
| `secure` | ❌ | ✅ |
| `sameSite` | `lax` | `none` |
| `path` | `/` | `/` |

- **httpOnly**: Prevents JavaScript access (XSS protection)
- **secure**: Only sent over HTTPS in production
- **sameSite**: `none` in production to allow cross-site requests (frontend may be on different origin)

---

## CORS Configuration

```typescript
app.use(cors({
  origin: env.CLIENT_URL ?? "http://localhost:8080",
  credentials: true,
}));
```

- Only allows requests from the configured `CLIENT_URL`
- `credentials: true` allows cookies to be sent cross-origin
- No wildcard origins — specific domain only

---

## Rate Limiting

Configured in `Backend/src/server.ts`:

```typescript
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 200,                   // 200 requests per window
    standardHeaders: true,
    legacyHeaders: false,
  })
);
```

| Setting | Value |
|---------|-------|
| Window | 15 minutes |
| Max requests | 200 per window per IP |
| Headers | Standard (`RateLimit-*`) |

> **Note**: Rate limiting is global. No endpoint-specific limits exist (e.g., login brute-force protection).

---

## Payment Security

### Razorpay Signature Verification

Every payment is verified server-side using HMAC-SHA256:

```typescript
const body = `${orderId}|${paymentId}`;
const expected = crypto
  .createHmac("sha256", RAZORPAY_KEY_SECRET)
  .update(body)
  .digest("hex");
return expected === signature;
```

- Prevents payment tampering
- Server-side only (secret never exposed to client)
- Both `orderId` and `paymentId` must match

### Razorpay Client Initialization

```typescript
const getRazorpayClient = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id, key_secret });
};
```

Returns `null` if keys not configured — graceful degradation.

---

## Password Reset Security

| Feature | Implementation |
|---------|---------------|
| Token generation | `crypto.randomBytes(32).toString("hex")` — 256-bit random |
| Token storage | SHA-256 hash stored in DB (raw token sent via email) |
| Expiration | Configurable (default 30 minutes) |
| Single use | `usedAt` timestamp prevents reuse |
| Email enumeration | Always returns success (doesn't reveal if email exists) |

---

## Google OAuth Security

| Feature | Implementation |
|---------|---------------|
| CSRF protection | Random `state` token in cookie, verified on callback |
| State cookie TTL | 10 minutes |
| Email verification | Only accepts `email_verified: true` from Google |
| Redirect validation | Only accepts paths starting with `/` |
| Scope | `email`, `profile`, `openid` |

---

## Input Validation

### Zod Schema Validation

All API inputs are validated using Zod schemas before processing:

```typescript
// Example from authController.ts
const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});
```

Invalid inputs immediately return 400 with the first validation issue.

### SQL Injection Prevention

Prisma ORM uses parameterized queries by default. No raw SQL is used anywhere in the codebase. This provides comprehensive SQL injection protection.

---

## Data Exposure

### API Response Filtering

User data in API responses excludes sensitive fields:

```typescript
// authService.ts — select only safe fields
select: {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  // passwordHash is NOT included
}
```

### Error Messages in Production

```typescript
if (env.NODE_ENV === "production") {
  res.status(500).json({ ok: false, error: { message: "Internal server error" } });
} else {
  res.status(500).json({ ok: false, error: { message: err.message, stack: err.stack } });
}
```

Stack traces are hidden in production.

---

## Security Audit Summary

| Category | Status | Notes |
|----------|--------|-------|
| Password hashing | ✅ Strong | bcrypt cost 10 |
| JWT in HTTP-only cookie | ✅ Strong | XSS-safe |
| CORS | ✅ Configured | Single-origin |
| Rate limiting | ⚠️ Basic | Global only, no per-endpoint limits |
| Input validation | ✅ Strong | Zod on all inputs |
| SQL injection | ✅ Protected | Prisma parameterized queries |
| Payment verification | ✅ Strong | HMAC-SHA256 |
| Password reset | ✅ Strong | Hashed tokens, expiring, single-use |
| OAuth CSRF | ✅ Protected | State parameter |
| Token blacklist | ❌ Missing | Logout doesn't invalidate JWT |
| Tariff endpoint | 🔴 Unprotected | `PUT /api/tariff/:id` has no auth |
| File upload | ✅ N/A | No upload endpoints exist |
| HTTPS | ⚠️ Config-dependent | Must be enabled in production |
| Helmet headers | ❌ Missing | No security headers middleware |
| CSRF (non-OAuth) | ⚠️ Partial | Relies on `sameSite` cookie + CORS |
| API key rotation | ❌ No mechanism | eZee/Razorpay keys require manual update |
