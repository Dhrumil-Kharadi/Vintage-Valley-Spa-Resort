# 05 — Environment Variables

All environment variables are validated at startup using **Zod** in `Backend/src/config/env.ts`. Invalid or missing required values will crash the server with a descriptive error.

## Backend Environment Variables

| Variable | Purpose | Required | Default | Example | Security Notes |
|----------|---------|----------|---------|---------|---------------|
| `PORT` | Backend server port | No | `5050` | `5050` | — |
| `NODE_ENV` | Environment mode | No | `development` | `development` / `production` | Controls error verbosity in responses |
| `CLIENT_URL` | Frontend origin for CORS + redirects | No | `http://localhost:8080` | `https://yourdomain.com` | Must match frontend URL exactly |
| `DATABASE_URL` | MySQL connection string | **Yes** | — | `mysql://root:pass@localhost:3306/vintage_valley` | 🔴 Contains DB credentials |
| `JWT_SECRET` | Secret key for signing JWTs | **Yes** (min 16 chars) | — | `a-very-long-random-string-here` | 🔴 Must be kept secret. Min 16 chars enforced by Zod |
| `JWT_EXPIRES_IN` | JWT token expiration duration | No | `7d` | `7d` / `24h` | Shorter = more secure but less convenient |
| `JWT_COOKIE_NAME` | Name of the HTTP-only auth cookie | No | `token` | `token` | — |
| `COOKIE_SECURE` | Set `Secure` flag on cookies | No | `false` | `true` in production | Must be `true` when using HTTPS |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID | No* | — | `rzp_test_xxx` | 🟡 Required for payments to work |
| `RAZORPAY_KEY_SECRET` | Razorpay API Key Secret | No* | — | `xxx` | 🔴 Must be kept secret |
| `GMAIL_USER` | Gmail address for email | No | — | `hotel@gmail.com` | Legacy — prefer SMTP vars |
| `GMAIL_APP_PASSWORD` | Gmail App Password | No | — | `xxxx xxxx xxxx xxxx` | Legacy — prefer SMTP vars |
| `EMAIL_FROM` | Sender "From" field | No | — | `"Vintage Valley <hotel@gmail.com>"` | — |
| `EMAIL_REPLY_TO` | Reply-To address | No | — | `hotel@gmail.com` | — |
| `SMTP_HOST` | SMTP server hostname | No* | — | `smtp.gmail.com` | 🟡 Required for email to work |
| `SMTP_PORT` | SMTP server port | No* | — | `587` | Use 587 for TLS, 465 for SSL |
| `SMTP_SECURE` | Use SSL for SMTP | No* | — | `false` | Auto-adjusted: port 587→false, 465→true |
| `SMTP_USER` | SMTP authentication user | No* | — | `hotel@gmail.com` | 🟡 Required for email |
| `SMTP_PASS` | SMTP authentication password | No* | — | `app-password` | 🔴 Must be kept secret |
| `RESET_TOKEN_EXPIRES_MINUTES` | Password reset token TTL | No | `30` | `30` | — |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | No | — | `xxx.apps.googleusercontent.com` | Required for Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | No | — | `GOCSPX-xxx` | 🔴 Must be kept secret |
| `GOOGLE_REDIRECT_URL` | OAuth callback URL | No | — | `https://yourdomain.com/api/auth/google/callback` | Must match Google Console config |
| `EZEE_BASE_URL` | eZee iPMS247 API base URL | No* | — | `https://live.ipms247.com/` | 🟡 Required for live room prices |
| `EZEE_HOTEL_CODE` | eZee hotel property code | No* | — | `46924` | 🟡 Required for eZee API |
| `EZEE_API_KEY` | eZee API authentication key | No* | — | `your-api-key` | 🔴 Must be kept secret |
| `EZEE_SOURCE_ID` | eZee booking source identifier | No | — | `source-id` | Required for InsertBooking API |
| `EZEE_PAYMENTTYPEUNKID` | eZee payment type ID | No | — | `payment-type-id` | Required for InsertBooking API |
| `EZEE_ALLOW_MISSING_BOOKING_IDS` | Allow booking without source/payment IDs | No | `false` | `false` | ⚠️ Only for debugging |

> \* Marked "No" because Zod makes them optional, but functionality is broken without them.

## Admin Environment Variables

The Admin server reads the same `.env` file as the Backend (via `preloadEnv.ts`). Additional variable:

| Variable | Purpose | Required | Default | Example |
|----------|---------|----------|---------|---------|
| `ADMIN_PORT` | Admin API server port | No | `5051` | `5051` |

## Seed Script Variables

Used by `prisma/seed.js` during database seeding:

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `ADMIN_EMAIL` | Email for initial admin user | No | `admin@hotel.com` |
| `ADMIN_PASSWORD` | Password for initial admin user | No | `SecureP@ss123` |

## Where Variables Are Used

```mermaid
graph LR
    ENV[".env File"]
    
    ENV --> |DATABASE_URL| PRISMA[Prisma ORM]
    ENV --> |JWT_*| AUTH[Auth Middleware]
    ENV --> |RAZORPAY_*| RZP[Razorpay Client]
    ENV --> |SMTP_* / GMAIL_*| MAILER[Email Sender]
    ENV --> |GOOGLE_*| OAUTH[Google OAuth]
    ENV --> |EZEE_*| EZEE[eZee API Service]
    ENV --> |CLIENT_URL| CORS[CORS + Redirects]
    ENV --> |NODE_ENV| ERR[Error Handler]
    ENV --> |COOKIE_*| COOKIE[Cookie Config]
```

## Security Best Practices

1. **Never commit `.env` files** — they are in `.gitignore`
2. **Use `.env.example`** as a template — it contains no secrets
3. **Rotate `JWT_SECRET`** periodically — existing tokens will be invalidated
4. **Use Gmail App Passwords** — never use your real Gmail password for `SMTP_PASS`
5. **Set `COOKIE_SECURE=true`** in production with HTTPS
6. **Keep `EZEE_API_KEY`** private — it controls your hotel's PMS access
7. **Use Razorpay test keys** (`rzp_test_*`) during development
