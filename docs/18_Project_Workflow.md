# 18 — Project Workflow

## End-to-End Application Flows

### 1. Guest Registration & Login

```mermaid
sequenceDiagram
    participant G as Guest
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    rect rgb(240, 248, 255)
    Note over G,DB: Email Registration
    G->>FE: Navigate to /login → click "Sign Up"
    G->>FE: Fill name, email, password, phone
    FE->>BE: POST /api/auth/signup
    BE->>BE: Zod validate signupSchema
    BE->>DB: Check email uniqueness
    BE->>BE: bcrypt.hash(password, 10)
    BE->>DB: user.create({name, email, passwordHash, role: USER})
    BE->>BE: signAccessToken({userId, role})
    BE-->>FE: Set-Cookie: token + {user}
    FE-->>G: Redirect to /rooms
    end
```

### 2. Room Browsing with Live Prices

```mermaid
sequenceDiagram
    participant G as Guest
    participant FE as Frontend
    participant BE as Backend
    participant EZ as eZee API
    participant DB as Database

    G->>FE: Navigate to /rooms
    FE->>BE: GET /api/rooms?checkIn=...&checkOut=...&adults=2
    
    BE->>EZ: fetchRoomList(params)
    
    alt eZee responds
        EZ-->>BE: Room data with live prices
        BE->>DB: Upsert to rooms_cache (backup)
        BE->>DB: Get active GLOBAL_FLAT promo
        BE->>BE: Apply global discount to all room prices
        BE-->>FE: {rooms: [...], meta: {}}
    else eZee fails
        BE->>DB: Query rooms_cache
        alt Cache hit
            DB-->>BE: Cached room data
            BE-->>FE: {rooms: [...], meta: {cached: true}}
        else Cache miss
            BE->>BE: Use static fallback data
            BE-->>FE: {rooms: [...], meta: {fallback: true}}
        end
    end
    
    FE-->>G: Display room cards with prices
```

### 3. Complete Booking Flow

```mermaid
sequenceDiagram
    participant G as Guest
    participant FE as Frontend
    participant BE as Backend
    participant EZ as eZee API
    participant RZP as Razorpay
    participant DB as Database
    participant EM as Email

    G->>FE: Select room → Navigate to /booking
    G->>FE: Pick dates, guests, meal plan per night
    G->>FE: Enter promo code (optional)
    
    FE->>BE: POST /api/promos/validate {code, baseAmount}
    BE-->>FE: {discountAmount: 500}
    
    FE->>FE: Show price breakdown to guest
    G->>FE: Click "Book Now"
    
    FE->>BE: POST /api/bookings {roomId, dates, guests, mealPlan, promo}
    
    BE->>EZ: fetchRoomList (get live prices)
    BE->>BE: Match room type by name
    BE->>BE: Calculate per-night: EP/CP/MAP rates
    BE->>BE: Add extras: children ₹1200, extra adults ₹1500
    BE->>BE: Apply promo discount
    BE->>BE: Apply global flat discount
    BE->>BE: GST 5% + Service Fee 2%
    
    BE->>RZP: orders.create({amount, currency: INR})
    RZP-->>BE: {orderId, amount}
    
    BE->>DB: Create Booking (PENDING) + Payment (CREATED)
    BE-->>FE: {booking, razorpay: {keyId, orderId, amount}}
    
    FE->>RZP: Open checkout modal
    G->>RZP: Complete payment (UPI/Card/Net banking)
    RZP-->>FE: {paymentId, signature}
    
    FE->>BE: POST /api/bookings/:id/verify
    BE->>BE: HMAC-SHA256 verify signature
    
    BE->>EZ: fetchRoomListRaw (get ALL variants)
    BE->>BE: Find matching EP/CP/MAP variant
    BE->>EZ: InsertBooking API (push to PMS)
    EZ-->>BE: {reservationNo, subReservationNos}
    
    BE->>DB: Transaction: Booking→CONFIRMED, Payment→PAID
    BE->>DB: Increment PromoCode.usedCount (if promo used)
    BE->>BE: Generate PDF invoice (jsPDF)
    BE->>EM: Send to guest + hotel owner (with PDF)
    
    BE-->>FE: {ok: true, booking}
    FE-->>G: Show confirmation with booking ID
```

### 4. Admin Manual Booking

```mermaid
sequenceDiagram
    participant S as Staff
    participant FE as Frontend
    participant BE as Backend
    participant EZ as eZee API
    participant DB as Database
    participant EM as Email

    S->>FE: Navigate to /admin/bookings → "New Booking"
    S->>FE: Fill guest info (name, email, phone)
    S->>FE: Select room, dates, guests, meal plan
    S->>FE: Select payment method (CASH/UPI/CARD)
    S->>FE: Optionally override amount
    
    FE->>BE: POST /api/admin/bookings/manual
    
    BE->>DB: Find or create User by email
    BE->>DB: Find Room by ID
    BE->>BE: Calculate full price breakdown
    
    BE->>EZ: fetchRoomListRaw (check availability)
    BE->>BE: Match room type + find meal plan variant
    BE->>EZ: InsertBooking (push to PMS)
    
    BE->>DB: Transaction:
    Note over DB: Create CONFIRMED Booking<br/>Create OFFLINE Payment (PAID)<br/>Allocate bookingNo (VVR-N)<br/>Increment promo usedCount
    
    BE->>BE: Generate PDF invoice
    BE->>EM: Send to guest + hotel owner
    
    BE-->>FE: {booking with all relations}
    FE-->>S: Show success + booking details
```

### 5. Payment Retry Flow

```mermaid
sequenceDiagram
    participant G as Guest
    participant FE as Frontend
    participant BE as Backend
    participant RZP as Razorpay

    G->>FE: Navigate to /profile
    FE->>BE: GET /api/bookings/me
    BE-->>FE: {bookings: [{status: "PENDING", ...}]}
    
    G->>FE: Click "Retry Payment" on PENDING booking
    FE->>BE: POST /api/bookings/:id/retry-payment
    
    BE->>BE: Verify booking ownership + PENDING status
    BE->>RZP: orders.create({amount: booking.amount})
    RZP-->>BE: {orderId}
    BE->>BE: Save new Payment (CREATED)
    
    BE-->>FE: {razorpay: {keyId, orderId, amount}}
    FE->>RZP: Open checkout
    Note over G,RZP: Same verify flow as initial booking
```

### 6. Inquiry Submission

```mermaid
sequenceDiagram
    participant V as Visitor
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database
    participant ADMIN as Admin Panel

    V->>FE: Navigate to /contact
    V->>FE: Fill name, email, phone, message
    FE->>BE: POST /api/inquiries {name, email, phone, message}
    BE->>DB: inquiry.create({status: UNREAD})
    BE-->>FE: {ok: true}
    FE-->>V: "Thank you" message
    
    Note over ADMIN: Later...
    ADMIN->>BE: GET /api/admin/inquiries
    BE->>DB: inquiry.findMany({orderBy: createdAt desc})
    BE-->>ADMIN: {inquiries: [...]}
    ADMIN->>BE: PATCH /api/admin/inquiries/:id/read
    BE->>DB: inquiry.update({status: READ})
```

### 7. Price Sync Workflow

```mermaid
sequenceDiagram
    participant SCHED as Scheduler
    participant BE as Backend
    participant EZ as eZee API
    participant DB as Database

    Note over SCHED: Triggered by interval or manual POST

    SCHED->>BE: syncPricesToDatabase()
    BE->>EZ: fetchRoomList (tomorrow → day after)
    EZ-->>BE: Room data with prices
    
    BE->>DB: Get all Room records
    
    loop For each eZee room
        BE->>BE: Match eZee room to DB room by title
        alt Match found
            BE->>DB: Update Room.pricePerNight, epPrice, cpPrice, mapPrice, availableRooms
        end
    end
    
    BE-->>SCHED: {updates: [{roomId, field, old, new}, ...]}
```
