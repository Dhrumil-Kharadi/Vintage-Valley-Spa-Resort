# 21 — Developer Guide

## How to Add a New API Endpoint

### Step 1: Define the Route

Create or edit a route file in `Backend/src/routes/`:

```typescript
// Backend/src/routes/myFeatureRoutes.ts
import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { myFeatureController } from "../controllers/myFeatureController";

export const myFeatureRouter = Router();

myFeatureRouter.get("/", asyncHandler(myFeatureController.list));
myFeatureRouter.post("/", requireAuth, asyncHandler(myFeatureController.create));
```

### Step 2: Register the Route

Add to `Backend/src/routes/index.ts`:

```typescript
import { myFeatureRouter } from "./myFeatureRoutes";

apiRouter.use("/my-feature", myFeatureRouter);
```

### Step 3: Create the Controller

```typescript
// Backend/src/controllers/myFeatureController.ts
import { Request, Response } from "express";
import { z } from "zod";
import { myFeatureService } from "../services/myFeatureService";

const createSchema = z.object({
  name: z.string().min(1),
  value: z.number().positive(),
});

export const myFeatureController = {
  async list(_req: Request, res: Response) {
    const items = await myFeatureService.list();
    res.json({ ok: true, data: { items } });
  },

  async create(req: Request, res: Response) {
    const parsed = createSchema.parse(req.body);
    const item = await myFeatureService.create(parsed);
    res.json({ ok: true, data: { item } });
  },
};
```

### Step 4: Create the Service

```typescript
// Backend/src/services/myFeatureService.ts
import { prisma } from "../prisma/client";
import { HttpError } from "../middlewares/errorHandler";

export const myFeatureService = {
  async list() {
    return prisma.myFeature.findMany({ orderBy: { createdAt: "desc" } });
  },

  async create(params: { name: string; value: number }) {
    if (!params.name) throw new HttpError(400, "Name is required");
    return prisma.myFeature.create({ data: params });
  },
};
```

---

## How to Add a New Database Model

### Step 1: Edit Prisma Schema

Add the model to `Backend/prisma/schema.prisma`:

```prisma
model MyFeature {
  id        String   @id @default(cuid())
  name      String
  value     Int
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([isActive])
  @@map("my_features")
}
```

### Step 2: Push Schema Changes

```bash
cd Backend
npx prisma db push        # Development — creates/alters tables
# OR
npx prisma migrate dev     # Creates a migration file (recommended for production)
```

### Step 3: Regenerate Prisma Client

```bash
npx prisma generate

# Also regenerate for Admin if it uses the model
cd ../Admin && npm run prisma:generate
```

### Step 4: Use in Services

The new model is now available on the Prisma client:

```typescript
import { prisma } from "../prisma/client";
const items = await prisma.myFeature.findMany();
```

---

## How to Add a New Frontend Page

### Step 1: Create the Page Component

```tsx
// Frontend/src/pages/MyFeature.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const MyFeature = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios.get("/api/my-feature")
      .then(res => setItems(res.data.data.items))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-8">
        <h1 className="text-3xl font-bold">My Feature</h1>
        {/* Content */}
      </main>
      <Footer />
    </div>
  );
};

export default MyFeature;
```

### Step 2: Add the Route

In `Frontend/src/App.tsx`:

```tsx
import MyFeature from "./pages/MyFeature";

// Inside <Routes>
<Route path="/my-feature" element={<MyFeature />} />
```

### Step 3: Add Navigation Link

In `Frontend/src/components/Navbar.tsx`, add a link to the navigation menu.

---

## How to Add an Admin Page

### Step 1: Create the Page

```tsx
// Frontend/src/pages/AdminMyFeature.tsx
import AdminLayout from "@/components/admin/AdminLayout";

const AdminMyFeature = () => {
  return (
    <AdminLayout>
      <h1>My Feature Management</h1>
      {/* Admin content */}
    </AdminLayout>
  );
};

export default AdminMyFeature;
```

### Step 2: Add Route in App.tsx

```tsx
<Route path="/admin/my-feature" element={<AdminMyFeature />} />
```

### Step 3: Add Sidebar Link

In `AdminLayout.tsx`, add a navigation item to the sidebar.

---

## How to Add a New Promo Code Rule

Promo validation is in `Backend/src/services/promoService.ts` → `validateForBaseAmount()`.

### Add a custom rule:

```typescript
// After the existing weekend check:
if (promo.appliesTo?.includes("my-custom-rule")) {
  // Custom validation logic
  if (!meetsMyRule(params)) {
    throw new HttpError(400, "This promo doesn't apply to your booking");
  }
}
```

---

## How to Add a New Environment Variable

### Step 1: Add to Zod Schema

In `Backend/src/config/env.ts`:

```typescript
const envSchema = z.object({
  // ... existing vars
  MY_NEW_VAR: z.string().default("fallback"),
});
```

### Step 2: Add to `.env.example`

```env
MY_NEW_VAR=value
```

### Step 3: Use in Code

```typescript
import { env } from "../config/env";
console.log(env.MY_NEW_VAR);
```

---

## How to Add an eZee Integration

### Room Data

The eZee API response structure varies. Always check for multiple field name patterns:

```typescript
const name = String(r?.Room_Name ?? r?.room_name ?? r?.RoomName ?? "");
const id = String(r?.roomtypeunkid ?? r?.Roomtypeunkid ?? r?.RoomTypeUNKID ?? "");
```

### New eZee API Call

1. Create a new method in `ezee.service.ts` or a new service file
2. Use the same URL construction pattern with `new URL(path, EZEE_BASE_URL)`
3. Set `timeout: 15000` and `validateStatus: () => true`
4. Map eZee errors with `mapEzeeErrorToHttpError()`

---

## Deployment Checklist

Before deploying changes:

1. [x] `npm run build` succeeds for Backend, Admin, and Frontend
2. [x] Environment variables are correct in production `.env`
3. [x] Database schema is in sync: `npx prisma db push`
4. [x] Prisma client is generated: `npx prisma generate`
5. [x] New npm dependencies installed: `npm install`
6. [x] Test critical flows manually
7. [x] Run deploy: `./deploy.sh` or manual PM2 restart

---

## Debugging Tips

### Enable Debug Logging

The codebase uses `console.log` with prefixed labels for debugging:

```
[DEBUG] Processing room 1: ...
[ADMIN EZEE DEBUG] Calling ezeeBookingService...
MAILER CONFIG >>> { host, port, ... }
```

### Prisma Query Logging

Enable in development:

```typescript
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });
```

### eZee API Response Inspection

Use `GET /api/rooms/raw?checkIn=...&checkOut=...` to see raw eZee responses.
