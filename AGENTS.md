# AGENTS.md (repo root)

Employee Onboarding and Salary Management System. Monorepo: `frontend/` (React + Vite), `backend/` (NestJS + Prisma + PostgreSQL).

## Source of truth
- Read `docs/PRD.md` before starting any task. Business rules are in sections 4a and 4b.
- If the PRD and the code disagree, stop and ask. Do not guess.
- Do not change the schema, API shape, or rules without updating `docs/PRD.md` in the same commit.

## How to work
1. Give a short plan first (files, endpoints, tests). Wait for approval before writing code.
2. Work on one module at a time. Do not touch other modules.
3. Run lint, tests and the app. Show the real output. Never say "done" without it.
4. Keep changes small and readable. No unused code, no leftover boilerplate, no TODO without a reason.
5. If something is unclear or the PRD has an open question (section 3), ask. Do not invent a rule.

## Git rules
- Commit **locally only**. Never `git push` unless I explicitly ask. (The first push to `origin main` is already done.)
- The commit author is me only. Never add `Co-Authored-By`, `Claude-Session`, "Generated with ..." or any other attribution or trailer line to commit messages or PR text. Do not change `git config` (name or email).
- Commit after each finished, working step (one module or one logical change per commit). Never leave working code uncommitted at the end of a task.
- Message format: `type(scope): short summary`. Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`. Example: `feat(salary): adjust salary with soft delete in a transaction`.
- Check `git status` before committing. Stage specific files, not blindly `git add .`.
- Never commit `.env`, secrets, `node_modules`, or build output. Only `.env.example` is tracked.
- Never rewrite history (`reset --hard`, `rebase`, `push --force`, `commit --amend` on older commits) unless I ask.
- Do not commit code that fails lint, tests or the build.

## Naming
- Business employee ID: DB `employee_no`, code `employeeNo`, UI label "Employee ID".
- `employee_id` / `employeeId` always means the foreign key (UUID) to `employees.id`.
- Database is snake_case, TypeScript is camelCase (Prisma `@map` / `@@map`).

## Money
- Store as `Decimal(12,2)`. Never use JS `number` or float for money.
- Compute with a decimal library. Round only for display, never between steps.
- API returns amounts as strings. Display in Philippine Peso (₱).
- Annual working-day divisor is the constant `314`.

## Soft delete
- Soft delete means setting `deleted_at`. Never hard delete salary assignments, salary components, or employee salary components.
- Active means `deleted_at IS NULL`. Every read, list and computation must use the shared filter. Do not write ad hoc filters.
- Uniqueness among active rows is enforced by partial unique indexes in the database (see PRD 4b), not only in code.

## Definition of done
- Behaviour matches the PRD acceptance criteria for the module.
- Validation works on client and server. The database constraints are in place.
- Lint passes, tests pass, app runs.
- Docs updated if behaviour changed. Local commit made.