# Vintage Valley Spa Resort — Project Documentation

> **Complete full-stack documentation** for the Vintage Valley Spa Resort booking platform.
> Generated from the actual codebase — every statement is grounded in source code.

---

##  Documentation Index

| # | Document | Description |
|---|----------|-------------|
| 01 | [Project Overview](./01_Project_Overview.md) | Purpose, features, users, tech stack |
| 02 | [System Architecture](./02_System_Architecture.md) | High-level diagrams, request flow, module interaction |
| 03 | [Project Structure](./03_Project_Structure.md) | Every folder and its responsibilities |
| 04 | [Setup Guide](./04_Setup_Guide.md) | How to run locally and deploy |
| 05 | [Environment Variables](./05_Environment_Variables.md) | Full table of all env vars |
| 06 | [Database](./06_Database.md) | ER diagram, every model, relationships |
| 07 | [API Documentation](./07_API_Documentation.md) | Every endpoint in Swagger-like format |
| 08 | [Authentication](./08_Authentication.md) | Login, signup, JWT, Google OAuth, password reset |
| 09 | [Authorization](./09_Authorization.md) | Roles, RBAC, protected routes |
| 10 | [Backend](./10_Backend.md) | Controllers, services, utilities |
| 11 | [Frontend](./11_Frontend.md) | Pages, components, routing, state |
| 12 | [Admin Panel](./12_Admin_Panel.md) | Dashboard, CRUD, management modules |
| 13 | [Business Logic](./13_Business_Logic.md) | Pricing, booking, eZee PMS, promos |
| 14 | [File Storage](./14_File_Storage.md) | Static assets, image handling |
| 15 | [Error Handling](./15_Error_Handling.md) | Global handler, error types, response format |
| 16 | [Security](./16_Security.md) | Hashing, JWT, CORS, rate limiting |
| 17 | [Validation](./17_Validation.md) | Zod schemas, frontend/backend validation |
| 18 | [Project Workflow](./18_Project_Workflow.md) | End-to-end application flows |
| 19 | [Testing](./19_Testing.md) | Current state and recommendations |
| 20 | [Troubleshooting](./20_Troubleshooting.md) | Common problems and fixes |
| 21 | [Developer Guide](./21_Developer_Guide.md) | How to add new APIs, models, pages |
| 22 | [Code Standards](./22_Code_Standards.md) | Naming, folder, architecture conventions |
| 23 | [Future Improvements](./23_Future_Improvements.md) | Refactoring, security, scalability |
| — | [CHANGELOG](./CHANGELOG.md) | Version history |

---

## Quick Start

```bash
# Backend
cd Backend && npm install && npx prisma generate && npx prisma db push && npm run dev

# Admin
cd Admin && npm install && npm run dev

# Frontend
cd Frontend && npm install && npm run dev
```

**Backend** runs on `:5050` · **Admin API** runs on `:5051` · **Frontend** runs on `:8080`

---

## Tech Stack at a Glance

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui |
| Backend API | Express.js + TypeScript |
| Admin API | Express.js + TypeScript (separate server) |
| Database | MySQL via Prisma ORM |
| Payments | Razorpay |
| PMS Integration | eZee Absolute (iPMS247) |
| Email | Nodemailer (SMTP / Gmail) |
| Auth | JWT + HTTP-only cookies + Google OAuth 2.0 |
| Deployment | PM2 + Nginx on VPS |
