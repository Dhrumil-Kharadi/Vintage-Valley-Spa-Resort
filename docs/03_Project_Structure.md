# 03 — Project Structure

## Root Directory

```
Vintage-Valley-Spa-Resort/
│
├── Backend/              # Main API server (Express.js, port 5050)
├── Admin/                # Admin-specific API server (Express.js, port 5051)
├── Frontend/             # React SPA (Vite, port 8080)
├── docs/                 # Project documentation (this folder)
│
├── deploy.sh             # One-command deploy script (git pull → build → PM2 restart)
├── .gitignore            # Root git ignore rules
│
├── *.md                  # Various integration notes and fix logs
│   ├── Booking_Price_Fix.md
│   ├── Complete_Price_Fix.md
│   ├── Frontend_Price_Fix.md
│   ├── README-LIVE-PRICES.md
│   ├── eZee_API_Integration_Status.md
│   ├── eZee_Integration_Success.md
│   ├── eZee_Price_Data_Fix.md
│   ├── eZee_booking_logs_example.md
│   └── ezee_booking_test_commands.md
│
└── *.json                # Sample eZee API response data (debugging artifacts)
    ├── available_rooms.json
    ├── room_data.json
    └── room_response.json
```

---

## Backend Directory (`Backend/`)

**Purpose**: Main API server handling authentication, room listing, booking, payments, eZee PMS integration, email, and promotional code management.

```
Backend/
├── .env                      # Environment variables (DO NOT COMMIT)
├── .env.example              # Template for environment variables
├── .gitignore                # Ignores node_modules, dist, .env
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
│
├── prisma/
│   ├── schema.prisma         # ⭐ Database schema — all models defined here
│   └── seed.js               # Database seeder — creates admin user + 4 room types
│
├── src/
│   ├── index.ts              # Entry point — creates server + listens on PORT
│   ├── server.ts             # Express app factory — CORS, rate limit, routes, error handling
│   │
│   ├── config/
│   │   ├── env.ts            # Zod-validated environment variable loading
│   │   └── db.ts             # Re-exports Prisma client from prisma/client
│   │
│   ├── prisma/
│   │   └── client.ts         # Prisma client singleton (auto-generated location)
│   │
│   ├── controllers/          # Route handlers — parse input, delegate to services
│   │   ├── authController.ts           # Signup, login, logout, Google OAuth, forgot/reset password, profile update
│   │   ├── bookingController.ts        # Create booking, verify payment, list user bookings, retry, invoice, delete pending
│   │   ├── adminController.ts          # List users/rooms/bookings/payments, create manual booking, delete booking
│   │   ├── roomController.ts           # List rooms (eZee live), raw list, get by ID, prices, Lotus availability
│   │   ├── roomLivePrice.controller.ts # Live prices, sync to DB, scheduler start/stop/status
│   │   ├── promoController.ts          # Validate promo, CRUD promo codes
│   │   ├── promoAdminController.ts     # Global flat promo CRUD (GLOBAL_FLAT scope)
│   │   ├── inquiryController.ts        # Create inquiry, list, unread count, mark read
│   │   └── tariffController.ts         # Get/update tariffs with default seeding
│   │
│   ├── routes/               # Express Router definitions — map URLs to controllers
│   │   ├── index.ts                    # Aggregates all routers under /api
│   │   ├── authRoutes.ts               # /api/auth/*
│   │   ├── bookingRoutes.ts            # /api/bookings/* (all require auth)
│   │   ├── adminRoutes.ts              # /api/admin/* (require auth + admin/staff)
│   │   ├── roomRoutes.ts               # /api/rooms/* (public)
│   │   ├── roomLivePrice.routes.ts     # /api/rooms-live/* (public)
│   │   ├── promoRoutes.ts              # /api/promos/* (validate is public, CRUD requires admin)
│   │   ├── promoAdminRoutes.ts         # /api/admin/promos/* (require auth + admin/staff)
│   │   ├── inquiryRoutes.ts            # /api/inquiries/* (create is public)
│   │   └── tariffRoutes.ts             # /api/tariff/* (get is public, put is unprotected)
│   │
│   ├── services/             # Business logic — database operations, external API calls
│   │   ├── authService.ts              # User CRUD, password hashing, reset tokens, Google findOrCreate
│   │   ├── bookingService.ts           # ⭐ Core booking logic — price calculation, Razorpay, eZee push, email
│   │   ├── adminService.ts             # ⭐ Admin booking logic — manual booking, email with PDF, eZee push
│   │   ├── ezee.service.ts             # eZee Room List API integration — fetchRoomList, fetchRoomListRaw
│   │   ├── ezeeBooking.service.ts      # eZee InsertBooking API — createAndConfirmBooking
│   │   ├── ezeeLivePrice.service.ts    # eZee live price fetching (alternative service)
│   │   ├── roomPriceSync.service.ts    # Sync eZee live prices to Room table in DB
│   │   ├── priceSyncScheduler.service.ts # Interval-based auto-sync scheduler
│   │   ├── promoService.ts             # Promo code CRUD + validation with night/weekend rules
│   │   ├── inquiryService.ts           # Inquiry CRUD
│   │   └── roomService.ts             # Simple Room findUnique wrapper
│   │
│   ├── middlewares/          # Express middleware functions
│   │   ├── auth.ts                     # requireAuth, requireAdmin, requireAdminOrStaff
│   │   ├── errorHandler.ts             # HttpError class + global error handler (Zod, HTTP, generic)
│   │   └── notFoundHandler.ts          # 404 catch-all for unmatched routes
│   │
│   └── utils/                # Shared utility functions
│       ├── asyncHandler.ts             # Wraps async route handlers for error propagation
│       ├── jwt.ts                      # Sign and verify JWT tokens
│       ├── cookies.ts                  # Set/clear HTTP-only auth cookies
│       ├── razorpay.ts                 # Razorpay client factory
│       ├── razorpaySignature.ts        # HMAC-SHA256 signature verification
│       ├── mailer.ts                   # SMTP/Gmail email sender with fallback logic
│       └── invoicePdf.ts              # PDF invoice generator using jsPDF
│
├── scripts/                  # Utility scripts (if any)
│
└── *.js / *.ts               # Test and debug scripts (not part of production)
    ├── fetch-all-data.js             # Fetch all eZee data
    ├── fetch-today-room-price.js     # Fetch today's room prices
    ├── test-ezee-api.js              # Test eZee API connectivity
    ├── test_ezee_booking.js          # Test eZee booking creation
    ├── test_smtp.js                  # Test SMTP email sending
    └── ... (various debugging scripts)
```

---

## Admin Directory (`Admin/`)

**Purpose**: Separate Express server (port 5051) providing admin-specific API endpoints. Reuses the Backend's Prisma schema and auth middlewares via relative imports.

```
Admin/
├── .env                      # Environment variables (reads from Backend/.env via preloadEnv)
├── .gitignore
├── package.json              # Dependencies (mirrors Backend + some differences)
├── tsconfig.json
├── prisma.schema.prisma      # Duplicate schema reference (not primary)
│
├── prisma/
│   └── schema.prisma         # Points to Backend schema via --schema flag in scripts
│
└── src/
    ├── index.ts              # Entry point — loads env, creates server, listens on ADMIN_PORT
    ├── server.ts             # Express app — CORS, routes under /admin-api, reuses Backend errorHandler
    │
    ├── config/
    │   └── preloadEnv.ts     # Smart .env loader — searches Backend/.env, Admin/.env, fallbacks
    │
    ├── routes/
    │   ├── index.ts                  # Aggregates admin routes under /admin-api
    │   ├── adminAuthRoutes.ts        # /admin-api/auth/* (login, signup, me, forgot/reset password)
    │   ├── adminDataRoutes.ts        # /admin-api/* (bookings, users, rooms — protected)
    │   ├── adminRoomRoutes.ts        # /admin-api/rooms/* (room CRUD — admin/staff only)
    │   └── adminPromoRoutes.ts       # /admin-api/promos/* (promo CRUD — admin/staff only)
    │
    ├── controllers/
    │   ├── adminAuthController.ts    # Admin login/signup/me/forgot-password/reset-password
    │   ├── adminDataController.ts    # List bookings/users/rooms, delete booking
    │   ├── adminRoomController.ts    # Update room details/pricing/images
    │   └── adminPromoController.ts   # Global flat promo CRUD
    │
    └── services/
        ├── adminAuthService.ts       # Admin-specific auth with role validation
        ├── adminDataService.ts       # Data fetching for admin dashboard
        ├── adminRoomService.ts       # Room update operations
        └── adminPromoService.ts      # Promo management with global flat support
```

> **Key design decision**: The Admin server imports middlewares from `../../../Backend/src/middlewares/auth` via relative paths. This couples the two servers at the filesystem level but avoids code duplication.

---

## Frontend Directory (`Frontend/`)

**Purpose**: React SPA with TailwindCSS and shadcn/ui components. Built with Vite, served by Nginx in production.

```
Frontend/
├── .gitignore
├── package.json              # React, Radix UI, TanStack Query, Recharts, etc.
├── vite.config.ts            # Vite config — proxy /api→:5050, /admin-api→:5051
├── tailwind.config.ts        # Tailwind with custom theme, animations
├── postcss.config.js         # PostCSS with Tailwind + Autoprefixer
├── tsconfig.json             # TypeScript config
├── tsconfig.app.json         # App-specific TS config
├── tsconfig.node.json        # Node-specific TS config (vite.config)
├── eslint.config.js          # ESLint configuration
├── components.json           # shadcn/ui component configuration
├── index.html                # HTML entry point
│
├── public/                   # Static assets served as-is
│   └── images/               # Room photos, gallery, facility images
│
└── src/
    ├── main.tsx              # React entry — renders <App />
    ├── App.tsx               # ⭐ Root component — routing, providers, all page routes
    ├── App.css               # Minimal global CSS overrides
    ├── index.css             # TailwindCSS base + custom CSS variables + animations
    ├── roomsData.ts          # Static room data (fallback/reference)
    ├── vite-env.d.ts         # Vite type declarations
    │
    ├── pages/                # ⭐ Page components (one per route)
    │   ├── Index.tsx                 # Home/landing page
    │   ├── Rooms.tsx                 # Room listing with live eZee prices (main page)
    │   ├── RoomsSynced.tsx           # Room listing from synced DB prices
    │   ├── Room.tsx                  # Single room detail page
    │   ├── RoomMinimal.tsx           # Minimal room view
    │   ├── RoomLive.tsx              # Live-price room view
    │   ├── booking.tsx               # ⭐ Full booking flow (date/guest/meal plan/promo/payment)
    │   ├── login.tsx                 # Login + signup with Google OAuth
    │   ├── Profile.tsx               # User profile + booking history + invoice download
    │   ├── Tariff.tsx                # Published tariff card
    │   ├── Facilities.tsx            # Resort facilities showcase
    │   ├── Attractions.tsx           # Nearby attractions
    │   ├── Gallery.tsx               # Photo gallery
    │   ├── Contact.tsx               # Contact form (creates inquiry)
    │   ├── NotFound.tsx              # 404 page
    │   │
    │   ├── AdminLogin.tsx            # Admin login page
    │   ├── AdminForgotPassword.tsx   # Admin password reset request
    │   ├── AdminResetPassword.tsx    # Admin password reset form
    │   ├── AdminHome.tsx             # Admin dashboard home
    │   ├── AdminDashboard.tsx        # Admin rooms overview
    │   ├── AdminBookings.tsx         # ⭐ Admin booking management (list, filter, manual create)
    │   ├── AdminUsers.tsx            # Admin user list
    │   ├── AdminPayments.tsx         # Admin payment list
    │   ├── AdminInquiries.tsx        # Admin inquiry management
    │   ├── AdminPromoCodes.tsx       # Admin promo code management
    │   └── AdminTariff.tsx           # Admin tariff editor
    │
    ├── components/           # Reusable UI components
    │   ├── Navbar.tsx                # Navigation bar with auth state
    │   ├── Footer.tsx                # Site footer with links
    │   ├── Hero.tsx                  # Hero banner component
    │   ├── FloatingContact.tsx       # Floating WhatsApp/phone button
    │   ├── ScrollToTop.tsx           # Auto-scroll on route change
    │   ├── PolicyModals.tsx          # Privacy, terms, refund policy modals
    │   ├── FacilityModal.tsx         # Facility detail modal
    │   │
    │   ├── admin/
    │   │   └── AdminLayout.tsx       # Admin page wrapper with sidebar navigation
    │   │
    │   └── ui/                       # shadcn/ui primitives (49 components)
    │       ├── button.tsx, card.tsx, dialog.tsx, table.tsx, ...
    │       └── (Radix UI based, consistent design system)
    │
    ├── hooks/                # Custom React hooks
    │   ├── use-mobile.tsx            # Mobile breakpoint detection
    │   └── use-toast.ts              # Toast notification hook
    │
    └── lib/                  # Frontend utility libraries
        ├── utils.ts                  # cn() class merge utility
        ├── roomService.ts            # API client for room endpoints
        ├── roomLivePrice.service.ts  # API client for live price endpoints
        ├── roomDatabase.service.ts   # API client for database price endpoints
        └── invoicePdf.ts             # Client-side PDF invoice generator
```

---

## Key Files Summary

| File | Purpose | Importance |
|------|---------|-----------|
| `Backend/prisma/schema.prisma` | All 12 database models | 🔴 Critical |
| `Backend/src/services/bookingService.ts` | Core booking + payment + eZee + email logic (1066 lines) | 🔴 Critical |
| `Backend/src/services/adminService.ts` | Admin manual booking + eZee + email (872 lines) | 🔴 Critical |
| `Backend/src/services/ezeeBooking.service.ts` | eZee InsertBooking API integration | 🔴 Critical |
| `Backend/src/services/ezee.service.ts` | eZee Room List API integration | 🔴 Critical |
| `Backend/src/config/env.ts` | Zod-validated environment config | 🟡 Important |
| `Backend/src/middlewares/auth.ts` | JWT verification + role guards | 🟡 Important |
| `Frontend/src/App.tsx` | All routing definitions | 🟡 Important |
| `Frontend/src/pages/booking.tsx` | Full booking UI (87K, largest file) | 🟡 Important |
| `Frontend/src/pages/AdminBookings.tsx` | Admin booking management (86K) | 🟡 Important |
| `deploy.sh` | Deployment automation | 🟢 Operational |
