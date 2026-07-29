# 11 — Frontend Documentation

## Overview

The frontend is a **React 18 SPA** built with **Vite**, **TypeScript**, **TailwindCSS**, and **shadcn/ui** components. It uses **TanStack React Query** for server state and **React Router DOM v6** for routing.

---

## Routing

All routes are defined in `App.tsx`. The root `/` redirects to `/rooms`.

### Public Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `Navigate → /rooms` | Redirect to rooms |
| `/home` | `Index` | Landing page |
| `/rooms` | `Rooms` | Main room listing with live prices |
| `/rooms-synced` | `RoomsSynced` | Room listing from DB-synced prices |
| `/room` | `Room` | Single room detail |
| `/room-minimal` | `RoomMinimal` | Minimal room view |
| `/room-live` | `RoomLive` | Live-priced room view |
| `/tariff` | `Tariff` | Published tariff card |
| `/facilities` | `Facilities` | Resort facilities |
| `/attractions` | `Attractions` | Nearby attractions |
| `/gallery` | `Gallery` | Photo gallery |
| `/contact` | `Contact` | Contact form |
| `/login` | `Login` | Login + signup |

### Protected Routes (require login)

| Path | Component | Purpose |
|------|-----------|---------|
| `/booking` | `Booking` | Full booking flow |
| `/booking/:id` | `Booking` | Booking with pre-selected room |
| `/profile` | `Profile` | User profile + booking history |

### Admin Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/admin/login` | `AdminLogin` | Admin login |
| `/admin/forgot-password` | `AdminForgotPassword` | Password reset request |
| `/admin/reset-password` | `AdminResetPassword` | Password reset form |
| `/admin` | `AdminHome` | Admin dashboard home |
| `/admin/rooms` | `AdminDashboard` | Room management |
| `/admin/users` | `AdminUsers` | User list |
| `/admin/bookings` | `AdminBookings` | Booking management |
| `/admin/payments` | `AdminPayments` | Payment list |
| `/admin/inquiries` | `AdminInquiries` | Inquiry management |
| `/admin/promos` | `AdminPromoCodes` | Promo code management |
| `/admin/tariff` | `AdminTariff` | Tariff editor |

---

## Key Pages

### `Rooms.tsx` (54K — Main Listing)
- Fetches rooms from `/api/rooms` with date/guest parameters
- Displays room cards with live eZee prices
- Shows EP/CP/MAP price variants from `day_wise_beforediscount`
- Applies global flat discount if active
- Handles loading, error, and fallback states
- Links to booking page for each room

### `booking.tsx` (87K — Booking Flow)
- Multi-step booking form: dates → room → guests → meal plan → promo → payment
- Date picker with check-in/check-out
- Per-night meal plan selection (EP/CP/MAP)
- Promo code validation with live discount preview
- Price breakdown: base + extras + discount + GST (5%) + service fee (2%)
- Razorpay checkout integration
- Payment retry for failed payments
- Invoice download after confirmation

### `Profile.tsx` (23K)
- Shows user info with edit capability
- Lists all user bookings with status badges
- Invoice download (PDF generation on client-side via jsPDF)
- Booking details modal

### `login.tsx` (13K)
- Email/password login form
- Signup form with name/email/password/phone
- Google OAuth button (redirects to `/api/auth/google`)
- Form validation with error messages

### `AdminBookings.tsx` (86K — Largest File)
- Full booking management table with search/filter
- Manual booking creation form (for walk-in guests)
- Booking detail modal
- Delete booking functionality
- New bookings count badge

### `Index.tsx` (42K — Landing Page)
- Hero section with resort imagery
- Room showcase cards
- Facilities overview
- Call-to-action sections
- Animated sections

### `Gallery.tsx` (27K)
- Photo gallery with category filtering
- Lightbox image viewer
- Responsive grid layout

### `Attractions.tsx` (28K)
- Nearby attractions with descriptions and images
- Distance and travel time information

---

## Components

### Shared Components

| Component | File | Purpose |
|-----------|------|---------|
| `Navbar` | `Navbar.tsx` (11K) | Site navigation with auth state, mobile menu, admin link |
| `Footer` | `Footer.tsx` (6K) | Footer with contact info, social links, policies |
| `Hero` | `Hero.tsx` (3K) | Reusable hero banner with background image |
| `FloatingContact` | `FloatingContact.tsx` (1K) | Floating WhatsApp/phone button |
| `ScrollToTop` | `ScrollToTop.tsx` | Auto-scrolls to top on route change |
| `PolicyModals` | `PolicyModals.tsx` (14K) | Privacy policy, terms, refund policy modals via context |
| `FacilityModal` | `FacilityModal.tsx` (9K) | Facility detail popup |
| `AdminLayout` | `admin/AdminLayout.tsx` (6K) | Admin page wrapper with sidebar navigation |

### UI Component Library (shadcn/ui)

49 components from the shadcn/ui library based on Radix UI primitives:

`accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input-otp`, `input`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `toggle-group`, `toggle`, `tooltip`

---

## State Management

### Server State — TanStack React Query

All API data fetching uses React Query:

```tsx
const queryClient = new QueryClient();
// Wraps entire app in QueryClientProvider
```

Pages use `useQuery` for data fetching and `useMutation` for writes. No global state store exists.

### Local State

Each page manages its own state with `useState` and `useEffect`. No Redux/Zustand/Context for global state (except PolicyModals context).

---

## API Integration

API calls use **axios** with the Vite dev server proxy:

```typescript
// vite.config.ts proxies
"/api" → "http://localhost:5050"
"/admin-api" → "http://localhost:5051"
```

### Frontend Service Files (`src/lib/`)

| File | Purpose |
|------|---------|
| `roomService.ts` | API client for `/api/rooms` endpoints |
| `roomLivePrice.service.ts` | API client for `/api/rooms-live` endpoints |
| `roomDatabase.service.ts` | API client for database price endpoints |
| `invoicePdf.ts` | Client-side PDF invoice generation |
| `utils.ts` | `cn()` — TailwindCSS class merge utility using `clsx` + `tailwind-merge` |

---

## Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useMobile` | `use-mobile.tsx` | Returns `boolean` for mobile breakpoint (< 768px) |
| `useToast` | `use-toast.ts` | Re-exports from shadcn toast system |

---

## Styling

- **TailwindCSS 3.4** with custom configuration in `tailwind.config.ts`
- **CSS Variables** defined in `index.css` for theming (light/dark support via HSL values)
- **Animations** via `tailwindcss-animate` plugin
- **Typography** plugin from `@tailwindcss/typography`
- **Custom fonts** and transitions defined in CSS

---

## Static Data

### `roomsData.ts`
Contains static room data with:
- Room titles, descriptions, capacities
- Static pricing (weekday/weekend)
- Amenity lists with Lucide icons
- Image paths

Used as fallback/reference data when eZee API is unavailable.

---

## Build Configuration

### Vite Config (`vite.config.ts`)
- **Port**: 8080
- **Proxy**: `/api` → backend, `/admin-api` → admin
- **Plugin**: `@vitejs/plugin-react-swc` (SWC for fast compilation)
- **Dev Plugin**: `lovable-tagger` (component tagging)
- **Alias**: `@` → `./src`

### TailwindCSS Config
- Custom colors, border radius, animations
- Content paths: `./pages/**`, `./components/**`, `./app/**`, `./src/**`
