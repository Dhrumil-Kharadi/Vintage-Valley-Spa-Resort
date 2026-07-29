# 02 — System Architecture

## High-Level Architecture

```mermaid
graph TB
    subgraph Client["Browser (React SPA)"]
        FE["Frontend<br/>React + Vite<br/>Port 8080"]
    end

    subgraph ReverseProxy["Nginx Reverse Proxy"]
        NG["nginx<br/>/var/www/html (static)<br/>/api → :5050<br/>/admin-api → :5051"]
    end

    subgraph BackendServer["Backend API Server"]
        BE["Express.js<br/>Port 5050"]
        MW["Middlewares<br/>auth · errorHandler<br/>rateLimit · CORS"]
        CTRL["Controllers"]
        SVC["Services"]
    end

    subgraph AdminServer["Admin API Server"]
        AE["Express.js<br/>Port 5051"]
        AC["Admin Controllers"]
        AS["Admin Services"]
    end

    subgraph DataLayer["Data Layer"]
        PR["Prisma ORM"]
        DB[("MySQL Database")]
    end

    subgraph ExternalAPIs["External Services"]
        EZEE["eZee iPMS247<br/>live.ipms247.com"]
        RZP["Razorpay<br/>Payment Gateway"]
        SMTP["SMTP Server<br/>(Gmail)"]
        GOOG["Google OAuth 2.0<br/>accounts.google.com"]
    end

    FE --> |HTTP Requests| NG
    NG --> |/api/*| BE
    NG --> |/admin-api/*| AE
    BE --> MW --> CTRL --> SVC
    AE --> AC --> AS
    SVC --> PR --> DB
    AS --> PR
    SVC --> EZEE
    SVC --> RZP
    SVC --> SMTP
    BE --> GOOG
```

## Request Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Nginx
    participant E as Express Server
    participant M as Middleware
    participant C as Controller
    participant S as Service
    participant P as Prisma
    participant D as MySQL

    B->>N: HTTP Request
    N->>E: Proxy to :5050 or :5051
    E->>M: CORS → Rate Limit → JSON Parse → Cookie Parse
    M->>M: Auth Middleware (JWT verify from cookie)
    M->>C: Route matched → Controller handler
    C->>C: Zod schema validation
    C->>S: Business logic delegation
    S->>P: Database query
    P->>D: SQL execution
    D-->>P: Result set
    P-->>S: Typed result
    S-->>C: Processed data
    C-->>B: JSON response {ok, data}
    
    Note over M,C: On error: asyncHandler catches<br/>→ errorHandler middleware formats response
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database
    participant G as Google OAuth

    rect rgb(240, 248, 255)
    Note over U,DB: Email/Password Login
    U->>FE: Submit email + password
    FE->>BE: POST /api/auth/login
    BE->>DB: Find user by email
    DB-->>BE: User record
    BE->>BE: bcrypt.compare(password, hash)
    BE->>BE: signAccessToken({userId, role})
    BE-->>FE: Set-Cookie: token=JWT (httpOnly)
    FE-->>U: Redirect to dashboard
    end

    rect rgb(255, 248, 240)
    Note over U,G: Google OAuth Login
    U->>FE: Click "Sign in with Google"
    FE->>BE: GET /api/auth/google
    BE-->>U: Redirect to Google consent
    U->>G: Grant consent
    G-->>BE: GET /api/auth/google/callback?code=...
    BE->>G: Exchange code for access_token
    G-->>BE: access_token
    BE->>G: Fetch userinfo
    G-->>BE: {email, name}
    BE->>DB: findOrCreate user
    BE->>BE: signAccessToken
    BE-->>FE: Set-Cookie + Redirect to CLIENT_URL
    end

    rect rgb(240, 255, 240)
    Note over U,DB: Password Reset Flow
    U->>FE: Submit email
    FE->>BE: POST /api/auth/forgot-password
    BE->>DB: Find user, create reset token (hashed)
    BE->>BE: Send email with reset link
    U->>FE: Click reset link with token
    FE->>BE: POST /api/auth/reset-password {token, newPassword}
    BE->>DB: Verify token hash, update password
    BE-->>FE: {ok: true}
    end
```

## Booking & Payment Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as MySQL
    participant RZP as Razorpay
    participant EZ as eZee PMS
    participant EM as Email

    U->>FE: Select room, dates, guests, meal plan
    FE->>BE: POST /api/bookings
    BE->>BE: Validate input (Zod)
    BE->>EZ: fetchLivePrices (checkIn, checkOut)
    EZ-->>BE: Live room prices
    BE->>BE: Calculate: base + extras + promo - discount + GST + service fee
    BE->>RZP: orders.create({amount, currency})
    RZP-->>BE: Razorpay Order {id, amount}
    BE->>DB: Create Booking (PENDING) + Payment (CREATED)
    BE-->>FE: {booking, razorpay: {keyId, orderId, amount}}

    FE->>RZP: Open Razorpay checkout modal
    U->>RZP: Complete payment
    RZP-->>FE: {razorpayPaymentId, razorpaySignature}

    FE->>BE: POST /api/bookings/:id/verify
    BE->>BE: verifyRazorpaySignature (HMAC-SHA256)
    BE->>EZ: fetchRoomListRaw (get room variant IDs)
    BE->>EZ: createAndConfirmBooking (InsertBooking API)
    EZ-->>BE: {reservationNo, subReservationNos}
    BE->>DB: Update Booking → CONFIRMED, Payment → PAID
    BE->>BE: Generate PDF invoice (jsPDF)
    BE->>EM: Send email with PDF attachment
    BE-->>FE: {ok: true, booking}
    FE-->>U: Show confirmation
```

## Database Interaction

```mermaid
graph LR
    subgraph Application
        SVC[Services Layer]
    end

    subgraph ORM
        PRISMA[Prisma Client]
    end

    subgraph Database
        USERS[(User)]
        ROOMS[(Room)]
        BOOKINGS[(Booking)]
        PAYMENTS[(Payment)]
        PROMOS[(PromoCode)]
        INQUIRIES[(Inquiry)]
        TARIFFS[(Tariff)]
        CACHE[(RoomCache)]
        TOKENS[(PasswordResetToken)]
        COUNTER[(BookingCounter)]
        IMAGES[(RoomImage)]
        AMENITIES[(RoomAmenity)]
    end

    SVC --> PRISMA
    PRISMA --> USERS
    PRISMA --> ROOMS
    PRISMA --> BOOKINGS
    PRISMA --> PAYMENTS
    PRISMA --> PROMOS
    PRISMA --> INQUIRIES
    PRISMA --> TARIFFS
    PRISMA --> CACHE
    PRISMA --> TOKENS
    PRISMA --> COUNTER
    PRISMA --> IMAGES
    PRISMA --> AMENITIES
```

## Module Interaction

```mermaid
graph TB
    AUTH[Auth Module] --> |JWT Token| BOOKING[Booking Module]
    AUTH --> |User lookup| ADMIN[Admin Module]
    
    ROOM[Room Module] --> |fetchRoomList| EZEE[eZee Service]
    ROOM --> |cache write| CACHE[RoomCache]
    
    BOOKING --> |fetchLivePrices| LIVE[eZee Live Price Service]
    BOOKING --> |createAndConfirmBooking| EZEEBOOK[eZee Booking Service]
    BOOKING --> |validateForBaseAmount| PROMO[Promo Module]
    BOOKING --> |orders.create + verify| RAZORPAY[Razorpay Util]
    BOOKING --> |sendMailSafe| MAILER[Mailer Util]
    BOOKING --> |generatePdf| PDF[Invoice PDF Util]
    
    ADMIN --> BOOKING
    ADMIN --> EZEE
    ADMIN --> EZEEBOOK
    ADMIN --> MAILER
    ADMIN --> PDF
    
    INQUIRY[Inquiry Module] --> |CRUD| DB[(Database)]
    TARIFF[Tariff Module] --> |CRUD| DB
```

## User Journey

```mermaid
graph TD
    A[Visit Website] --> B{Authenticated?}
    B -->|No| C[Browse Rooms / Gallery / Tariff / Attractions]
    B -->|Yes| D[Browse Rooms with Booking Option]
    
    C --> E[Login / Signup]
    E --> D
    
    D --> F[Select Room & Dates]
    F --> G[Choose Meal Plan per Night]
    G --> H[Apply Promo Code]
    H --> I[Review Price Breakdown]
    I --> J[Pay via Razorpay]
    J --> K{Payment Success?}
    
    K -->|Yes| L[Booking Confirmed in eZee]
    L --> M[Email with PDF Invoice]
    M --> N[View in Profile]
    
    K -->|No| O[Retry Payment]
    O --> J

    N --> P[Download Invoice]
```

## Component Relationship (Frontend)

```mermaid
graph TB
    APP[App.tsx] --> ROUTER[BrowserRouter + Routes]
    
    ROUTER --> INDEX[Index - Home Page]
    ROUTER --> ROOMS[Rooms - Room Listing]
    ROUTER --> BOOKING[Booking - Booking Flow]
    ROUTER --> LOGIN[Login - Auth Page]
    ROUTER --> PROFILE[Profile - User Profile]
    ROUTER --> TARIFF[Tariff - Price Card]
    ROUTER --> CONTACT[Contact - Inquiry Form]
    ROUTER --> GALLERY[Gallery - Photo Gallery]
    ROUTER --> ATTRACTIONS[Attractions - Nearby Places]
    ROUTER --> FACILITIES[Facilities - Resort Amenities]
    
    ROUTER --> ADMIN_LOGIN[Admin Login]
    ROUTER --> ADMIN_HOME[Admin Home]
    ROUTER --> ADMIN_DASH[Admin Dashboard]
    ROUTER --> ADMIN_BOOK[Admin Bookings]
    ROUTER --> ADMIN_USERS[Admin Users]
    ROUTER --> ADMIN_PAY[Admin Payments]
    ROUTER --> ADMIN_INQ[Admin Inquiries]
    ROUTER --> ADMIN_PROMO[Admin Promo Codes]
    ROUTER --> ADMIN_TARIFF[Admin Tariff]
    
    subgraph Shared Components
        NAVBAR[Navbar]
        FOOTER[Footer]
        HERO[Hero]
        FLOATING[FloatingContact]
        POLICY[PolicyModals]
    end
    
    subgraph UI Library - shadcn
        BUTTON[Button]
        CARD[Card]
        DIALOG[Dialog]
        TABLE[Table]
        TOAST[Toast / Sonner]
        CALENDAR[Calendar]
        SELECT[Select]
        TABS[Tabs]
    end
```

## Deployment Architecture

```mermaid
graph TB
    subgraph VPS["VPS Server (147.93.20.20)"]
        subgraph Nginx
            NG["Nginx<br/>:80 / :443<br/>Static files + Reverse proxy"]
        end
        
        subgraph PM2["PM2 Process Manager"]
            BE["Backend<br/>:5050"]
            AE["Admin API<br/>:5051"]
        end
        
        subgraph Static
            DIST["/var/www/html/<br/>Frontend dist/"]
        end
    end
    
    subgraph External
        DB[("MySQL<br/>Database")]
        EZEE["eZee iPMS247"]
        RZP["Razorpay"]
        GMAIL["Gmail SMTP"]
    end
    
    NG --> DIST
    NG -->|/api| BE
    NG -->|/admin-api| AE
    BE --> DB
    AE --> DB
    BE --> EZEE
    BE --> RZP
    BE --> GMAIL
```
