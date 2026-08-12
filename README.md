# Nexora ERP

**Operations, Inventory & Customer Intelligence** — a mini ERP + CRM operations portal built for a wholesale/distribution business, developed as a full-stack developer case study.

> Manages customers, products, stock, sales challans, and CRM follow-ups for internal teams: Sales, Warehouse, Accounts, and Admin.

---

## 1. Project Overview

Nexora ERP is a modular-monolith full-stack application demonstrating production-grade patterns:

- Clean layered backend architecture (Routes → Controllers → Services → Prisma → PostgreSQL)
- Real transactional business logic (challan confirmation, stock deduction, rollback safety)
- Role-based authentication & authorization enforced on the server, not just the UI
- A polished, responsive, professional SaaS-style frontend with light/dark mode
- Full test coverage of the critical business rule: **stock can never go negative**

## 2. Features

- **Auth & RBAC** — JWT login, 4 roles (Admin, Sales, Warehouse, Accounts), route + API-level enforcement
- **CRM** — customer profiles, follow-up timeline, lead/active/inactive lifecycle, search & filters
- **Inventory** — products, categories, warehouses, computed stock status (Healthy/Low/Out), full stock movement ledger
- **Sales Challans** — multi-product draft → confirm → cancel workflow with **transactional, race-condition-safe stock deduction**
- **Dashboard** — live aggregated stats and charts (no hardcoded numbers)
- **Audit Logs** — every sensitive action is recorded
- **PDF Export** — branded challan PDF download
- **Global Search** — Ctrl+K command palette across customers/products/challans
- **Swagger Docs** — `/api/docs`
- **Docker & CI** — one-command local spin-up, GitHub Actions pipeline

## 3. Architecture

```
nexora-erp/
├── client/          React + TypeScript + Vite + Tailwind CSS frontend
├── server/          Node + Express + TypeScript + Prisma + PostgreSQL API
├── docs/            Additional documentation
├── postman/         Postman collection
├── .github/         CI workflow
└── docker-compose.yml
```

**Backend layering** (no business logic in route handlers):

```
Routes → Controllers → Services → Prisma (Repository) → PostgreSQL
```

### Architecture Diagram

```mermaid
flowchart LR
    subgraph Client["React Client (Vite + Tailwind)"]
        UI[Pages & Components]
        RQ[TanStack Query]
    end

    subgraph API["Express API (TypeScript)"]
        MW[Auth + RBAC + Validation Middleware]
        CTRL[Controllers]
        SVC[Services / Business Logic]
    end

    DB[(PostgreSQL via Prisma)]

    UI --> RQ --> MW --> CTRL --> SVC --> DB
    SVC -. transactional stock deduction .-> DB
```

### Challan Confirmation Flow (critical business logic)

```mermaid
sequenceDiagram
    participant U as Sales User
    participant API as Challan API
    participant DB as PostgreSQL (transaction)

    U->>API: POST /challans/:id/confirm
    API->>DB: BEGIN (Serializable)
    API->>DB: SELECT ... FOR UPDATE (lock product rows)
    alt stock insufficient
        API->>DB: ROLLBACK
        API-->>U: 409 Insufficient stock for SKU-X
    else stock sufficient
        API->>DB: Deduct stock, insert OUT movement(s)
        API->>DB: Update challan → CONFIRMED
        API->>DB: Insert audit log
        API->>DB: COMMIT
        API-->>U: 200 Confirmed
    end
```

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, TypeScript, Express, Prisma, PostgreSQL, Zod, JWT, bcrypt |
| Frontend | React, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Recharts, Lucide |
| Docs | Swagger/OpenAPI, Postman |
| DevOps | Docker, docker-compose, GitHub Actions |
| Testing | Vitest, Supertest |

## 5. Database Design

Entities: `User`, `Customer`, `CustomerFollowup`, `Category`, `Warehouse`, `Product`, `StockMovement`, `Challan`, `ChallanItem`, `AuditLog`.

Key design decisions:
- **UUID primary keys** throughout.
- **Product snapshots on `ChallanItem`** (`productName`, `sku`, `unitPrice` copied at creation time) so editing a product later never rewrites historical challans.
- **`stockStatus` is computed and stored** on the product (`HEALTHY` / `LOW_STOCK` / `OUT_OF_STOCK`) so list queries don't need to compute it per-row.
- Every inventory mutation goes through `StockMovement` — stock is **never** modified silently.
- Indexes on frequently filtered/sorted columns (`status`, `sku`, `stockStatus`, `createdAt`, etc).

See `server/prisma/schema.prisma` for the full schema.

## 6. Environment Variables

**server/.env** (copy from `server/.env.example`):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexora_erp?schema=public"
JWT_SECRET="replace-with-a-long-random-string"
JWT_EXPIRES_IN="8h"
PORT=4000
NODE_ENV=development
CLIENT_URL="http://localhost:5173"
```

**client/.env** (copy from `client/.env.example`):
```
VITE_API_URL=http://localhost:4000/api
```

## 7. Local Setup (without Docker)

Prerequisites: Node.js 20+, PostgreSQL 14+.

```bash
# 1. Clone and enter the project
cd nexora-erp

# 2. Backend
cd server
cp .env.example .env      # edit DATABASE_URL/JWT_SECRET if needed
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev                # http://localhost:4000

# 3. Frontend (in a new terminal)
cd ../client
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

## 8. Local Setup (with Docker)

```bash
docker compose up --build
```

This starts PostgreSQL, runs migrations + seed, and serves:
- API → http://localhost:4000
- Frontend → http://localhost:5173
- Swagger docs → http://localhost:4000/api/docs

## 9. Demo Credentials

Password for all demo accounts: **`Passw0rd!`**

| Role | Email |
|---|---|
| Admin | admin@nexora.demo |
| Sales | sales@nexora.demo |
| Warehouse | warehouse@nexora.demo |
| Accounts | accounts@nexora.demo |

## 10. Running Tests

Tests run against a real PostgreSQL database and truncate tables between runs — **do not point `DATABASE_URL` at production data.**

```bash
cd server
npm test
```

Covers: login & RBAC enforcement, customer/product validation, pagination, and — most importantly — the challan business logic:
- Confirming a challan with `stock=5, requested=8` is **rejected** with `409 INSUFFICIENT_STOCK`, and the stock/challan status remain untouched.
- Confirming with `stock=10, requested=4` deducts stock to `6` and creates an `OUT` stock movement.
- A multi-item challan where only one line item has insufficient stock rolls back **entirely** — no partial deduction.
- Product edits after a challan is created don't alter the stored snapshot.

## 11. API Documentation

- Swagger UI: `GET /api/docs` (once the server is running)
- Postman collection: [`postman/Nexora-ERP.postman_collection.json`](./postman/Nexora-ERP.postman_collection.json) — import into Postman, set `baseUrl`, run **Auth → Login** first (it auto-populates `{{token}}`).

## 12. Deployment

Recommended free-tier stack:

| Component | Service |
|---|---|
| Frontend | Vercel (or Netlify) |
| Backend | Render (Web Service) |
| Database | Neon (or Render PostgreSQL) |

**Backend (Render):**
1. Create a PostgreSQL instance (Neon or Render) and copy the connection string.
2. Create a Web Service pointing at `server/`, build command `npm install && npm run build`, start command `npx prisma migrate deploy && npm run prisma:seed && npm start`.
3. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `NODE_ENV=production`.

**Frontend (Vercel):**
1. Import `client/` as the project root.
2. Set `VITE_API_URL` to the deployed backend's `/api` URL.
3. Build command `npm run build`, output directory `dist`.

## 13. Assumptions

- A "wholesale/distribution company" implies GST is optional per customer (not all retail customers have one).
- Challan `DRAFT` status does not reserve stock — stock is only affected on `CONFIRM`, matching the spec's stated business rule.
- Cancelling a `CONFIRMED` challan reverses stock (an intentional enhancement beyond the minimum spec, to keep inventory accurate).
- Single-currency (INR) demo data; multi-currency was out of scope.

## 14. Known Limitations

- No file/image upload for products (S3 bonus not implemented — out of 48-hour scope).
- No email/SMS notifications for low-stock or follow-up reminders.
- Invoices (as distinct from challans) are not implemented — the case study lists them as optional if they don't add unnecessary complexity; challans cover the required sales workflow.
- No refresh-token rotation — JWT expires after 8h and requires re-login (acceptable for an internal ops tool).
- PDF export is challan-only; no bulk/batch export.

## 15. Future Improvements

- Refresh tokens + silent re-auth
- Invoice generation from confirmed challans
- Product image upload via S3
- Low-stock email/SMS alerts
- Multi-warehouse transfer workflow
- E2E tests (Playwright) for the frontend

---

Built as a case study submission. See inline code comments for reasoning behind key architectural decisions (transaction isolation, row locking, product snapshots).
