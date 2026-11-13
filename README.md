# Employee Onboarding and Salary Management System

A small HR/payroll-style web app with four integrated modules: onboard employees, assign each a monthly basic salary, manage dynamic salary components per employee, and compute salary rates (annual, daily, hourly, per-minute) in Philippine Peso. The API is protected by JWT authentication (short-lived access token plus a rotating refresh token).

| | |
|---|---|
| **Backend** | NestJS, Prisma 8 (release candidate), PostgreSQL 15+ |
| **Frontend** | React 19, Vite, TypeScript, React Router, TanStack Query, React Hook Form + Zod. The scaffold is in place; the pages are not built yet. |
| **Source of truth** | [`docs/PRD.md`](docs/PRD.md) (requirements, data model, API, business rules) |
| **ERD** | [`docs/ERD.pdf`](docs/ERD.pdf) and the diagram in the PRD |

## Run it locally

You need Node.js 22.18 or newer and a PostgreSQL 15+ server.

**1. Database.** Use your own PostgreSQL, or start one with Docker:

```bash
docker compose up -d
```

The compose file creates `salary_management_system_db` (user `postgres`, password `postgres` unless you set `POSTGRES_PASSWORD`). Change `POSTGRES_PORT` if 5432 is taken.

**2. Backend setup.**

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`: set `DATABASE_URL`, generate two different JWT secrets (the command is in the file), and choose the seed admin email and password.

**3. Create the tables, add sample data, start the API.**

```bash
npx prisma db migrate
npm run seed
npm run start:dev
```

The API listens on `http://localhost:3000/api`. Interactive docs are at `http://localhost:3000/api/docs`; use `POST /api/auth/login` with the seed admin from your `.env`, then paste the `accessToken` into the Authorize button.

`npm run seed` is safe to run again. It creates the admin and four sample employees: EMP-001 is the worked example from the spec (basic ₱30,000 + Rice ₱2,000 + Transportation ₱1,500 = ₱33,500 a month), and EMP-004 has no salary assigned.

**4. Frontend** (in a second terminal, with the backend running).

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite forwards `/api` to the backend on port 3000, so no CORS setup is needed in development. Change the target with `VITE_API_PROXY_TARGET` (see `frontend/.env.example`).

## Checks

```bash
cd backend
npm run lint
npm test            # unit tests
npm run test:e2e    # end-to-end tests against a real PostgreSQL
npm run build

cd ../frontend
npm run lint
npm test
npm run build       # type-checks, then bundles
```

The e2e tests use their own database, `<your database>_test`. They create and migrate it automatically and refuse to run against your development database. Set `TEST_DATABASE_URL` to use a different one.

## What each module does

| Module | Endpoints (all under `/api`, all need a token except login and refresh) |
|---|---|
| Authentication | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`, `GET`/`PATCH /users/me` |
| 1. Employees | `GET`/`POST /employees` (`?search=`), `GET`/`PATCH /employees/:id` |
| 2. Salary | `PUT`/`GET /employees/:id/salary`, `GET /employees/:id/salary/history` |
| 3. Salary components | `GET`/`POST /salary-components`, `PATCH`/`DELETE /salary-components/:id`, `GET`/`POST /employees/:id/components`, `PATCH`/`DELETE /employees/:id/components/:ecId` |
| 4. Computation | `GET /employees/:id/computation` |
| Health | `GET /health` (public) checks the database connection |

## Decisions worth knowing

- **Soft delete.** Salary assignments, salary components and employee salary components are never removed. A `deleted_at` timestamp marks a row as deleted, and every read goes through one shared filter. Adjusting a salary soft-deletes the active row and inserts a new one in a single transaction, so the salary history is kept.
- **Uniqueness lives in the database.** Partial unique indexes (`WHERE deleted_at IS NULL`) allow one active salary per employee, one active component name, and one active assignment per employee and component, while deleted rows never block a new one. Check constraints reject a zero or negative salary and a negative component amount.
- **Money.** Stored as `NUMERIC(12,2)`, computed with `decimal.js`, sent and received as decimal strings (`"30000.00"`), never as JS numbers. Rates are rounded only for display, never between steps. The annual working-day divisor is the constant `314`.
- **Authentication.** Access token (15 minutes) in the response body, refresh token (7 days) in an `httpOnly`, `SameSite=Strict` cookie scoped to `/api/auth`. Only a SHA-256 hash of the refresh token is stored. Each refresh rotates the token, and replaying an old one revokes the whole login. Changing your password signs you out everywhere.
- **Errors.** Every error is `{ statusCode, message, errors[] }`. Bad input is a `400`, a duplicate is a `409`, and unexpected failures are a generic `500` with the details only in the server log.
- **Assumptions** (PRD section 3): components add to the salary, rates use basic plus components, a basic salary must be above zero, hire date cannot be in the future, and renaming a component applies to every employee that uses it.

## Repository layout

```
docs/                PRD.md, ERD.pdf
backend/             NestJS API (see backend/README.md)
frontend/            React app (scaffold only so far)
docker-compose.yml   local PostgreSQL
```
