# 22 — Code Standards

## Naming Conventions

### Files

| Type | Convention | Example |
|------|-----------|---------|
| Controllers | `camelCase` + `Controller` suffix | `authController.ts`, `bookingController.ts` |
| Services | `camelCase` + `Service` suffix | `authService.ts`, `bookingService.ts` |
| Routes | `camelCase` + `Routes` suffix | `authRoutes.ts`, `bookingRoutes.ts` |
| Middlewares | `camelCase` | `auth.ts`, `errorHandler.ts` |
| Utilities | `camelCase` | `jwt.ts`, `cookies.ts`, `mailer.ts` |
| React pages | `PascalCase` | `Rooms.tsx`, `AdminBookings.tsx` |
| React components | `PascalCase` | `Navbar.tsx`, `AdminLayout.tsx` |
| Config files | `camelCase` | `env.ts`, `preloadEnv.ts` |
| eZee services | `camelCase` + `.service` suffix | `ezee.service.ts`, `ezeeBooking.service.ts` |

### Variables and Functions

| Type | Convention | Example |
|------|-----------|---------|
| Functions | `camelCase` | `signAccessToken`, `verifyRazorpaySignature` |
| Constants | `camelCase` or `UPPER_SNAKE` (env) | `apiRouter`, `JWT_SECRET` |
| Zod schemas | `camelCase` + `Schema` suffix | `signupSchema`, `createSchema` |
| Type aliases | `PascalCase` | `JwtPayload`, `EzeeRoom` |
| Enums (Prisma) | `PascalCase` | `Role`, `BookingStatus` |
| Enum values | `UPPER_SNAKE` | `USER`, `CONFIRMED`, `GLOBAL_FLAT` |

### Database

| Type | Convention | Example |
|------|-----------|---------|
| Models | `PascalCase` (singular) | `User`, `Booking`, `PromoCode` |
| Table names | `snake_case` (via `@@map`) | `rooms_cache`, `my_features` |
| Columns | `camelCase` | `passwordHash`, `checkIn`, `pricePerNight` |
| Enums | `PascalCase` | `Role`, `PaymentStatus` |

---

## Architecture Patterns

### Controller → Service → Database

All business logic follows this flow:

```
Route (URL) → Controller (parse/validate) → Service (logic) → Prisma (DB)
```

**Rules**:
1. Controllers **never** access the database directly (with one exception: `tariffController`)
2. Services **never** send HTTP responses
3. Controllers handle request/response; services handle business logic
4. Errors are thrown as `HttpError` — the error handler formats the response

### Service Object Pattern

Services are exported as plain objects with async methods:

```typescript
export const myService = {
  async list() { ... },
  async create(params) { ... },
};
```

Not classes — no `new`, no `this`, no dependency injection.

### Response Format

All API responses follow:

```typescript
// Success
{ ok: true, data: { ... } }

// Error
{ ok: false, error: { message: "..." } }
```

### Async Handler Pattern

Every route handler is wrapped in `asyncHandler`:

```typescript
router.get("/", asyncHandler(async (req, res) => {
  // Promise rejections are caught and forwarded to error handler
}));
```

---

## TypeScript Conventions

### Strict Mode

TypeScript is configured with standard strict settings. Type assertions (`as any`) are used in some Prisma interactions to work around complex generated types.

### Type Exports

Types are defined alongside their usage:

```typescript
// jwt.ts
export type JwtPayload = {
  userId: string;
  role: "USER" | "ADMIN" | "STAFF";
};
```

### Prisma Type Handling

Due to Prisma's generated types, some services use `any` casts:

```typescript
const promos: any[] = await (prisma as any).promoCode.findMany({...});
```

This is a pragmatic choice to avoid complex generic type threading.

---

## Code Organization

### Import Order (Observed Pattern)

1. Node.js built-ins (`crypto`, `path`)
2. Third-party packages (`express`, `axios`, `zod`)
3. Internal config (`../config/env`)
4. Internal middlewares (`../middlewares/errorHandler`)
5. Internal services (`../services/...`)
6. Internal utilities (`../utils/...`)

### File Structure Rules

1. **One export per file** for controllers and services (export the object, not individual functions)
2. **Zod schemas defined inline** in controllers (not in separate schema files)
3. **Helper functions** defined at the top of the file before the main export
4. **Constants** (like rounding functions, regex) at the top of the file

---

## Error Handling Conventions

| Where | How |
|-------|-----|
| Service validation errors | `throw new HttpError(statusCode, message)` |
| External API failures | `throw new HttpError(502, message)` |
| Auth failures | `throw new HttpError(401, "Unauthorized")` |
| Not found | `throw new HttpError(404, "Resource not found")` |
| Duplicates | `throw new HttpError(409, "Already exists")` |
| Non-critical failures (email) | `console.error()` — never throw |

---

## Git Conventions

### `.gitignore` Patterns

```
node_modules/
dist/
.env
*.log
```

### Branch Strategy

Not documented in the codebase. The deploy script pulls from `main`:

```bash
git pull origin main
```

---

## Logging

The codebase uses `console.log` and `console.error` directly — no logging framework.

### Log Prefixes

| Prefix | Module |
|--------|--------|
| `[DEBUG]` | eZee room processing |
| `[ADMIN EZEE DEBUG]` | Admin eZee booking |
| `[ADMIN EZEE ERROR]` | Admin eZee errors |
| `MAILER CONFIG >>>` | Email configuration |
| `MAILER SENT >>>` | Email sent successfully |
| `MAILER ERROR >>>` | Email failure |
| `MAILER SKIP >>>` | Email skipped (no config) |
| `ADMIN ENV LOADED >>>` | Admin env loaded |
| `✅` / `⚠️` | Success / warning indicators |

---

## Code Quality

### ESLint

Frontend uses ESLint with:
- `@eslint/js` base config
- `eslint-plugin-react-hooks` for React rules
- `eslint-plugin-react-refresh` for Vite HMR

### Notable Patterns

1. **`// eslint-disable-next-line no-console`** — Used frequently in services where console logging is intentional
2. **`as any`** casts — Used pragmatically for Prisma type workarounds
3. **No Prettier** — No formatter configuration found
4. **No Husky** — No pre-commit hooks
