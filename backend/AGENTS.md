# AGENTS.md (backend)

NestJS + Prisma 8 (RC) + PostgreSQL. Follow the root `AGENTS.md` too. This file adds backend-specific rules.

The pattern guide is `docs/BACKEND_GUIDE.md`. The Users module is the blueprint: new modules copy its folder structure (`dto/`, `entities/`, controller, service, module), DTO validation, response DTOs, Swagger decorators and guard usage.

Requirements: Node.js 22.18+ and TypeScript 5.9+. Local database: `salary_management_system_db` (connection string only in `.env` as `DATABASE_URL`, never committed).

## Structure
- `prisma/contract.prisma` and `prisma.config.ts` (backend root), plus the migrations and seed script.
- `src/prisma/`: the Prisma module and service that register one shared database instance. Do not edit files emitted by `contract emit`.
- `src/common/`: `JwtAuthGuard`, `@Public()`, exception filters, shared pipes.
- `src/config/`: environment validation. The app must fail at startup if a required variable (especially JWT secrets) is missing.
- `src/modules/<name>/`: one folder per domain: `auth`, `users`, `employees`, `salary`, `salary-components`, `computation`. Each has controller, service, `dto/`.
- Controllers stay thin. Business logic lives in services.

## Prisma 8 and database
- Prisma 8 uses `contract.prisma`. Do NOT use `prisma generate`, `prisma migrate dev` or `prisma db push`, and do not use the old `PrismaClient` pattern or invent query methods.
- Schema change workflow: edit `prisma/contract.prisma`, then run `npx prisma contract emit`, `npx prisma migration plan --name <name>`, review the plan, then `npx prisma db migrate --advance-ref db`.
- First setup used `npx prisma db init`. Never edit a migration that was already applied. Create a new one.
- Use the supported mapping so the database stays snake_case.
- Check whether the contract can express partial unique indexes. If it cannot, add the SQL by hand in the migration (PRD 4b) and review it before applying:
  - `uq_active_salary_per_employee`
  - `uq_active_component_name`
  - `uq_active_component_per_employee`
- Use CHECK constraints: `monthly_basic_salary > 0`, `amount >= 0`.
- Multi-step writes use `prisma.$transaction`. Salary adjustment = soft delete the active row, then insert the new row, in one transaction.
- Soft delete read filtering lives in one Prisma client extension (or one shared helper). Do not repeat `deletedAt: null` by hand in services.
- Seed with `npm run seed` (idempotent). It creates the admin user and sample employees. Seed password is hashed, never plain.
- If a command from the guide does not exist in the installed version, stop and ask. Do not substitute Prisma 6/7 commands.

## Validation and errors
- DTOs use `class-validator`. Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- Error shape: `{ statusCode, message, errors[] }`. `400` validation, `401` auth, `404` not found, `409` duplicate.
- Duplicates: rely on the database unique violation (Prisma `P2002`) and map it to `409`. Do not use check-then-insert as the only guard.
- Never return stack traces or internal errors to the client.

## Authentication (PRD Module 0)
- Access token: JWT, 15m, signed with `JWT_ACCESS_SECRET`, sent as Bearer header.
- Refresh token: JWT, 7d, signed with a **different** secret `JWT_REFRESH_SECRET`, sent only as an httpOnly, Secure (in production), `SameSite=Strict` cookie with `Path=/api/auth`.
- Store only the SHA-256 hash of the refresh token. Never store or log the raw token.
- Refresh rotates: mark the old token revoked, issue a new one with the same `family_id`, set `replaced_by_id`, all in one transaction.
- Reuse of a revoked refresh token revokes the whole family and returns `401`.
- Register `JwtAuthGuard` globally. Only `@Public()` routes (login, refresh) are open.
- Pin the algorithm (HS256) on sign and verify.
- Hash passwords with argon2id or bcrypt (cost 12 or higher). Never log or return password hashes.
- Rate limit `/auth/login` and `/auth/refresh` (`@nestjs/throttler`). Login failure message is generic: "Invalid email or password".
- CORS: explicit `FRONTEND_ORIGIN` with `credentials: true`. No wildcard.

## Computation
- Computed on the server only. Monthly salary = active basic salary + active components.
- Annual = monthly × 12. Daily = annual ÷ 314. Hourly = daily ÷ 8. Per-minute = hourly ÷ 60.
- Use the full-precision value at every step. Hourly comes from the unrounded daily.

## Tests
- Add tests with every module. Minimum cases are listed in PRD section 8.
- Must have: a test that inserting a duplicate active row is rejected by the database (all three indexes), a test that soft-deleted rows never appear in lists or computation, and auth tests for rotation, reuse detection and logout.

## Before saying done
Run lint, the tests, and start the app. Show the output.