# Backend

## Setup

1. Create a MySQL database.
2. Copy `.env.example` to `.env` and fill values.
3. Install deps:

```bash
npm install
```

4. Prisma:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Run dev server:

```bash
npm run dev
```

## Environment variables

See `.env.example`.
