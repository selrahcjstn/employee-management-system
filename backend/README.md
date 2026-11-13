# Backend

NestJS API for the Employee Onboarding and Salary Management System, on Prisma 8 and PostgreSQL. Setup and run steps are in the [root README](../README.md); the requirements are in [`docs/PRD.md`](../docs/PRD.md), and the working rules for this folder are in [`AGENTS.md`](AGENTS.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run start:dev` | Start the API with reload on `http://localhost:3000/api` |
| `npm run build` / `npm run start:prod` | Compile to `dist/` and run it |
| `npm run seed` | Create the admin and sample employees (safe to repeat) |
| `npm run lint` | Type-aware lint (`oxlint`) |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests on a separate `_test` database, created and migrated automatically |
| `npm run contract:emit` | Regenerate `src/prisma/contract.json` and `contract.d.ts` after editing `prisma/contract.prisma` |

## Changing the database schema

Prisma 8 uses `prisma/contract.prisma` as the source of truth. Do not use `prisma generate`, `migrate dev` or `db push`.

```bash
npx prisma contract emit
npx prisma migration plan --name <what-changed>   # then read the generated SQL
npx prisma db migrate --advance-ref db
```

Never edit a migration that has already been applied; plan a new one. Update `docs/PRD.md` in the same commit.

## Layout

```
prisma/              contract.prisma (schema), seed.ts
migrations/          planned migrations (committed)
src/common/          global guard, @Public(), exception filter, input middleware, validators, money helpers
src/config/          environment validation (the app refuses to start on bad config)
src/prisma/          shared database client and the soft-delete scopes
src/modules/         auth, users, employees, salary, salary-components, computation, pay, health
test/                end-to-end tests
```
