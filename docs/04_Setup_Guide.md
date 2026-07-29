# 04 — Setup Guide

## Prerequisites

| Software | Minimum Version | Purpose |
|----------|----------------|---------|
| **Node.js** | 18.x+ (LTS recommended) | Runtime for backend + frontend build |
| **npm** | 9.x+ (ships with Node) | Package manager |
| **MySQL** | 8.0+ | Database server |
| **Git** | 2.x+ | Version control |

### Optional
| Software | Purpose |
|----------|---------|
| **PM2** | Production process manager |
| **Nginx** | Production reverse proxy + static serving |
| **Prisma Studio** | Visual database explorer |

---

## 1. Clone the Repository

```bash
git clone <repository-url> Vintage-Valley-Spa-Resort
cd Vintage-Valley-Spa-Resort
```

---

## 2. Configure Environment Variables

### Backend `.env`

```bash
cp Backend/.env.example Backend/.env
```

Edit `Backend/.env` and fill in all required values:

```env
PORT=5050
NODE_ENV=development
CLIENT_URL=http://localhost:8080

DATABASE_URL=mysql://root:password@localhost:3306/vintage_valley

JWT_SECRET=your-minimum-16-char-secret-key-here
JWT_EXPIRES_IN=7d
JWT_COOKIE_NAME=token
COOKIE_SECURE=false

RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your-app-password

EZEE_BASE_URL=https://live.ipms247.com/
EZEE_HOTEL_CODE=46924
EZEE_API_KEY=your-ezee-api-key

EZEE_SOURCE_ID=your-source-id
EZEE_PAYMENTTYPEUNKID=your-payment-type-id
```

### Admin `.env`

The Admin server reads from `Backend/.env` via its `preloadEnv.ts` module. You can also create `Admin/.env` with additional overrides:

```env
ADMIN_PORT=5051
```

> **Note**: See [05_Environment_Variables.md](./05_Environment_Variables.md) for a complete reference of all variables.

---

## 3. Set Up the Database

### Create the MySQL database:

```sql
CREATE DATABASE vintage_valley CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Push the Prisma schema (creates tables):

```bash
cd Backend
npm install
npx prisma db push
```

### Generate the Prisma client:

```bash
npx prisma generate
```

### Seed the database (creates admin user + rooms):

```bash
# Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first
npx prisma db seed
```

The seed script creates:
- 1 Admin user (from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars)
- 4 Room types: Deluxe Studio Suite, Deluxe Edge View, Lotus Family Suite, Presidential Suite

### (Optional) Explore with Prisma Studio:

```bash
npx prisma studio
```

---

## 4. Install Dependencies

```bash
# Backend
cd Backend
npm install

# Admin
cd ../Admin
npm install

# Frontend
cd ../Frontend
npm install
```

---

## 5. Run in Development Mode

Open **three terminal windows**:

### Terminal 1 — Backend API (port 5050)
```bash
cd Backend
npm run dev
```
Uses `ts-node-dev` with `--respawn --transpile-only` for hot reloading.

### Terminal 2 — Admin API (port 5051)
```bash
cd Admin
npm run dev
```
Also uses `ts-node-dev`.

### Terminal 3 — Frontend (port 8080)
```bash
cd Frontend
npm run dev
```
Vite dev server with HMR. Proxies `/api` → `:5050` and `/admin-api` → `:5051`.

### Access the application:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:5050 |
| Admin API | http://localhost:5051 |
| Health Check | http://localhost:5050/api/health |

---

## 6. Production Build

### Build all three projects:

```bash
# Backend
cd Backend
npm run build      # Compiles TypeScript → dist/

# Admin
cd ../Admin
npm run build      # Compiles TypeScript → dist/

# Frontend
cd ../Frontend
npm run build      # Vite production build → dist/
```

### Run in production:

```bash
# Backend
cd Backend
node dist/index.js

# Admin
cd Admin
node dist/index.js
```

---

## 7. Production Deployment (VPS)

The included `deploy.sh` script automates the full deployment:

```bash
chmod +x deploy.sh
./deploy.sh
```

### What `deploy.sh` does:

1. `git pull origin main` — Pull latest code
2. **Backend**: `npm install` → `prisma db push` → `prisma generate` → `npm run build`
3. **Admin**: `npm install` → `npm run build`
4. **Frontend**: `npm install` → `npm run build` → copy `dist/*` to `/var/www/html/`
5. `pm2 restart all` — Restart Node processes
6. `systemctl reload nginx` — Reload Nginx config

### PM2 Setup (first time):

```bash
# Start Backend
cd Backend
pm2 start dist/index.js --name backend

# Start Admin
cd ../Admin
pm2 start dist/index.js --name admin

# Save PM2 config
pm2 save
pm2 startup
```

### Nginx Configuration (example):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5050;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin-api/ {
        proxy_pass http://127.0.0.1:5051;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Available npm Scripts

### Backend

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `ts-node-dev --respawn --transpile-only src/index.ts` | Development with hot reload |
| `build` | `tsc -p tsconfig.json` | Compile TypeScript |
| `start` | `node dist/index.js` | Run production build |
| `prisma:generate` | `prisma generate` | Generate Prisma client |
| `prisma:migrate` | `prisma migrate dev` | Run migrations |
| `prisma:studio` | `prisma studio` | Visual DB explorer |

### Admin

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `ts-node-dev --respawn --transpile-only src/index.ts` | Development with hot reload |
| `build` | `tsc -p tsconfig.json` | Compile TypeScript |
| `start` | `node dist/index.js` | Run production build |
| `prisma:generate` | `prisma generate --schema ../Backend/prisma/schema.prisma` | Generate from Backend schema |

### Frontend

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Dev server with HMR (port 8080) |
| `build` | `vite build` | Production build |
| `build:dev` | `vite build --mode development` | Dev-mode build |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint .` | Run linter |
