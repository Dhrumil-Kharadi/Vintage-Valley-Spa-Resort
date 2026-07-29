# 08 — Authentication

## Overview

Authentication uses **JWT (JSON Web Tokens)** stored in **HTTP-only cookies**. Three login methods are supported: email/password, Google OAuth 2.0, and admin-specific login (same mechanism, different UI flow).

---

## Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    U->>FE: Enter email + password
    FE->>BE: POST /api/auth/login {email, password}
    BE->>BE: Zod validate (loginSchema)
    BE->>DB: prisma.user.findUnique({email})
    DB-->>BE: User record (with passwordHash)
    BE->>BE: bcrypt.compare(password, passwordHash)
    alt Match
        BE->>BE: signAccessToken({userId, role})
        BE-->>FE: Set-Cookie: token=JWT (httpOnly, sameSite) + {ok, data: {user}}
        FE-->>U: Redirect to /rooms or /admin
    else No Match
        BE-->>FE: 401 {ok: false, error: {message: "Invalid credentials"}}
    end
```

### JWT Payload

```typescript
type JwtPayload = {
  userId: string;   // User.id (cuid)
  role: "USER" | "ADMIN" | "STAFF";
};
```

### JWT Configuration

| Setting | Source | Default |
|---------|--------|---------|
| Secret | `env.JWT_SECRET` | — (required, min 16 chars) |
| Expiration | `env.JWT_EXPIRES_IN` | `7d` |
| Algorithm | jsonwebtoken default | HS256 |

---

## Registration Flow

```mermaid
sequenceDiagram
    participant U as User
    participant BE as Backend
    participant DB as Database

    U->>BE: POST /api/auth/signup {name, email, password, phone?}
    BE->>BE: Zod validate (signupSchema)
    BE->>DB: findUnique({email})
    alt Email exists
        BE-->>U: 409 "Email already registered"
    else New user
        BE->>BE: bcrypt.hash(password, 10)
        BE->>DB: user.create({name, email, passwordHash, role: "USER"})
        BE->>BE: signAccessToken({userId, role})
        BE-->>U: Set-Cookie + {ok, data: {user}}
    end
```

**Password hashing**: bcrypt with cost factor 10. The hash is stored in `User.passwordHash`.

---

## Google OAuth 2.0 Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant G as Google

    U->>FE: Click "Sign in with Google"
    FE->>BE: GET /api/auth/google?redirect=/booking
    
    Note over BE: Generate CSRF state token<br/>Set cookies: oauth_state, oauth_redirect
    
    BE-->>U: 302 Redirect → Google consent URL
    U->>G: Approve access
    G-->>BE: GET /api/auth/google/callback?code=xxx&state=yyy

    BE->>BE: Verify state matches oauth_state cookie
    BE->>G: POST https://oauth2.googleapis.com/token (exchange code)
    G-->>BE: {access_token}
    BE->>G: GET https://openidconnect.googleapis.com/v1/userinfo
    G-->>BE: {email, name, email_verified}

    alt email_verified = true
        BE->>BE: authService.findOrCreateFromGoogle({email, name})
        Note over BE: If user exists → return existing<br/>If new → create with random password
        BE->>BE: signAccessToken
        BE-->>U: Set-Cookie + 302 Redirect → CLIENT_URL + redirect
    else Verification failed
        BE-->>U: 302 Redirect → CLIENT_URL/login?oauth=failed
    end
```

### Security Measures

- **CSRF Protection**: Random `state` token stored in cookie, verified on callback
- **Email Verification**: Only accepts `email_verified: true` from Google
- **Safe Redirect**: Only accepts redirect paths starting with `/`
- **Cookie TTL**: OAuth state cookies expire after 10 minutes

### Google OAuth Users

- Created with `role: USER` (cannot be admin via OAuth)
- Get a random 32-byte hex password hash (cannot login with password unless reset)
- Name defaults to Google profile name or "Guest"

---

## JWT Cookie Configuration

Defined in `Backend/src/utils/cookies.ts`:

```typescript
const getAuthCookieOptions = (): CookieOptions => {
  const isProd = env.NODE_ENV === "production";
  return {
    httpOnly: true,          // Not accessible via JavaScript
    sameSite: isProd ? "none" : "lax",  // Cross-site in prod (for separate frontend domain)
    secure: env.COOKIE_SECURE || isProd, // HTTPS only in production
    path: "/",               // Available on all routes
  };
};
```

| Property | Development | Production |
|----------|------------|------------|
| `httpOnly` | `true` | `true` |
| `sameSite` | `lax` | `none` |
| `secure` | `false` | `true` |

---

## Password Reset Flow

```mermaid
sequenceDiagram
    participant U as User
    participant BE as Backend
    participant DB as Database
    participant EM as Email

    U->>BE: POST /api/auth/forgot-password {email}
    BE->>DB: findUnique({email})
    alt User exists
        BE->>BE: Generate random 32-byte hex token
        BE->>BE: SHA-256 hash the token
        BE->>DB: Create PasswordResetToken {userId, tokenHash, expiresAt}
        BE->>EM: Send email with reset link containing raw token
    end
    BE-->>U: {ok: true} (always, to prevent email enumeration)

    U->>BE: POST /api/auth/reset-password {token, newPassword}
    BE->>BE: SHA-256 hash the incoming token
    BE->>DB: Find PasswordResetToken by tokenHash
    alt Valid + not expired + not used
        BE->>BE: bcrypt.hash(newPassword, 10)
        BE->>DB: Transaction: update User.passwordHash + mark token as used
        BE-->>U: {ok: true}
    else Invalid
        BE-->>U: 400 "Invalid or expired token"
    end
```

### Security Details

- **Token storage**: Only the SHA-256 hash is stored in the database (raw token sent via email)
- **Expiration**: Configurable via `RESET_TOKEN_EXPIRES_MINUTES` (default 30 min)
- **Single use**: `usedAt` field prevents token reuse
- **Indexes**: `tokenHash` (unique), `userId`, `expiresAt` for fast lookups

---

## Logout Flow

Simply clears the JWT cookie:

```typescript
const clearAuthCookie = (res: Response) => {
  res.clearCookie(env.JWT_COOKIE_NAME, { path: "/" });
};
```

No server-side token blacklist exists — JWT remains valid until expiration. This is a known trade-off for simplicity.

---

## Profile Update

Authenticated users can update their name, phone, and password:

```typescript
const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
});
```

If `password` is provided, it's re-hashed with bcrypt before storage.
