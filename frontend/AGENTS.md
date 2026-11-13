# AGENTS.md (frontend)

React + Vite. Follow the root `AGENTS.md` too.

## Structure
- `src/app/`: `providers.tsx`, `router.tsx`, and the `layout/` (`AppLayout`, sidebar, header).
- `src/features/<name>/`: `auth`, `employees`, `salary`, `components`, `computation`. Each has its pages, components, hooks and API calls (`auth` also has `context/` for `AuthProvider` and `routes/` for `ProtectedRoute`).
- `src/shared/api/`: the one axios instance with `withCredentials: true` and the interceptors, the in-memory token store, the shared refresh, and API error parsing.
- `src/shared/ui/`: Button, TextField, Alert and the other building blocks. `src/shared/lib/`: utilities such as `formatPeso()`. `src/shared/pages/`: pages with no feature.
- `src/styles/`: `tokens.css` (DESIGN.md as the Tailwind theme) and `index.css`.

## SVG assets
- Every SVG file lives in `src/assets/` (the login illustration in `src/assets/login/`). Do not paste SVG markup into components.
- Import it as text and draw it with `InlineSvg`: `import grid from '../assets/login/hero-grid.svg?raw'`. It is inlined, not an `<img>`, so it can use the design tokens (`var(--color-primary-600)`) and the Inter font.
- Colors in an SVG come only from the token variables. No hex, `rgb()` or `hsl()`. `src/assets/assets.test.ts` enforces this, and also that an SVG has no script, external link or duplicate `id`.
- Decorative drawings are `aria-hidden` (`InlineSvg` does it) and never focusable.

## Styling
- Tailwind CSS v4. The theme in `src/styles/tokens.css` is DESIGN.md: it resets Tailwind's own palette, type scale and breakpoints, so only the design tokens exist as utilities (`bg-primary-600`, `text-danger`, `border-field`).
- Spacing steps are 2, 4, 6, 8, 10, 12 and 16 (8 to 64px), and 1 only for the 4px half-step. No arbitrary values such as `p-[13px]`.
- The focus ring is global (2px primary, 2px offset). Do not remove it; do not set `outline-none`.

## Auth handling
- Keep the access token in memory only. Never use localStorage or sessionStorage for tokens.
- On app load call `POST /auth/refresh` to restore the session. If it fails, go to `/login`. The restore and the 401 handler both go through `refreshSession()`, which shares one in-flight request: the server rotates the refresh token on every call, so two refreshes with the same cookie (React StrictMode runs effects twice in development) would be treated as a replay and end the session.
- On a `401` (not from `/auth/*`), call refresh **once** using one shared in-flight promise so parallel requests wait for the same refresh, then retry the original request. If refresh fails, clear state and go to `/login`.
- Logout calls `/auth/logout`, clears memory state and the query cache.
- Wrap all four module routes in `ProtectedRoute`.

## Data and forms
- Server state with TanStack Query. A successful save invalidates the related queries so the other modules refresh (this is how the modules stay integrated).
- Forms use React Hook Form + Zod. Validation rules match the backend.
- Never compute salary rates on the client. Display what the API returns.
- Show money with `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`.

## UX
- Cover loading, empty, validation error and server error states on every page.
- Confirm before remove or soft delete.
- Show server `409` messages inline next to the field (for example "Employee ID already exists").
- Employee ID field is read-only when editing.

## Before saying done
Run lint and build, and click through the flow in the browser. Show the output.
