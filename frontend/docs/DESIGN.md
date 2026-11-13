# DESIGN.md: Employee Onboarding and Salary Management System

Frontend style guide. Follow this for every screen. If a value is not here, derive it from the 8px rule and the tokens, do not invent a new one.

**Design goals:** calm, trustworthy, easy to scan. This is an HR/payroll tool, so numbers must be clear, tables must be readable, and mistakes (negative salary, duplicates) must be obvious and easy to fix.

---

## 1. Principles

1. **Clarity over decoration.** White surfaces, one accent color, plenty of space.
2. **Numbers are the product.** Money is aligned, tabular, and never truncated.
3. **One accent.** Blue marks actions and focus. Color is never the only signal (pair it with text or an icon).
4. **8px rhythm.** Every size and gap is a multiple of 8px (4px is allowed only for tight pairs such as icon + label).
5. **Every state designed.** Loading, empty, error, success, disabled, focus.
6. **Accessible by default.** WCAG 2.2 AA contrast, visible focus, keyboard friendly.

---

## 2. Color Palette

### 2.1 Brand and neutrals

| Token | Hex | Use |
|---|---|---|
| `--color-primary-50` | `#EFF6FF` | Selected row, soft backgrounds |
| `--color-primary-100` | `#DBEAFE` | Hover on soft surfaces |
| `--color-primary-200` | `#BFDBFE` | Soft borders |
| `--color-primary-600` | `#2563EB` | **Primary** (buttons, links, focus ring) |
| `--color-primary-700` | `#1D4ED8` | Primary hover |
| `--color-primary-800` | `#1E40AF` | Primary pressed |
| `--color-neutral-0` | `#FFFFFF` | Cards, inputs, table body |
| `--color-neutral-50` | `#F8FAFC` | **App background** |
| `--color-neutral-100` | `#F1F5F9` | Table header, disabled field background |
| `--color-neutral-200` | `#E2E8F0` | Dividers, card borders |
| `--color-neutral-400` | `#94A3B8` | Disabled text, decorative icons only |
| `--color-neutral-500` | `#64748B` | Muted text, placeholders |
| `--color-neutral-600` | `#475569` | Secondary text, labels |
| `--color-neutral-700` | `#334155` | Strong secondary text |
| `--color-neutral-900` | `#0F172A` | **Primary text**, headings |
| `--color-border-input` | `#7C8798` | Input borders (passes 3:1 against white) |

### 2.2 Semantic colors

| Meaning | Text/icon | Background | Border |
|---|---|---|---|
| Success | `#15803D` | `#F0FDF4` | `#BBF7D0` |
| Warning | `#B45309` | `#FFFBEB` | `#FDE68A` |
| Danger | `#B91C1C` | `#FEF2F2` | `#FECACA` |
| Info | `#0369A1` | `#F0F9FF` | `#BAE6FD` |

Danger solid (destructive buttons): background `#B91C1C`, hover `#991B1B`, text white.

### 2.3 Semantic use in this app

| Situation | Color |
|---|---|
| Primary action (Save, Add, Compute) | Primary 600 |
| Remove / soft delete | Danger (outline first, solid in the confirm dialog) |
| Active status badge | Success |
| Deleted/removed (history rows) | Neutral 500 text, neutral 100 background |
| Validation error text and field border | Danger |
| Saved confirmation toast | Success |
| Total row in computation | Primary 50 background |

### 2.4 Contrast (checked, WCAG AA needs 4.5:1 for text, 3:1 for UI parts)

| Pair | Ratio | Result |
|---|---|---|
| `#0F172A` on white (body text) | 17.85 | Pass |
| `#475569` on white (secondary text) | 7.58 | Pass |
| `#64748B` on white (muted text) | 4.76 | Pass |
| `#64748B` on `#F8FAFC` | 4.55 | Pass (do not go lighter) |
| White on `#2563EB` (primary button) | 5.17 | Pass |
| White on `#1D4ED8` (primary hover) | 6.70 | Pass |
| `#2563EB` on white (links) | 5.17 | Pass |
| `#2563EB` on `#EFF6FF` | 4.75 | Pass |
| `#15803D` on `#F0FDF4` | 4.79 | Pass |
| `#B45309` on `#FFFBEB` | 4.84 | Pass |
| `#B91C1C` on `#FEF2F2` | 5.91 | Pass |
| White on `#B91C1C` (danger button) | 6.47 | Pass |
| `#7C8798` on white (input border) | 3.64 | Pass (UI 3:1) |
| `#94A3B8` on white | 2.56 | **Fail for text.** Disabled or decorative only |

Rule: never use neutral 400 or lighter for text that must be read.

---

## 3. Typography

### 3.1 Font

**Inter** (variable). It is highly readable at small sizes, has tabular figures for aligned money, and supports the Philippine peso sign `₱` (verify it renders in your build; the fallback stack covers it).

Install: `npm i @fontsource-variable/inter`, then `import '@fontsource-variable/inter'` in `main.tsx`.

```css
--font-sans: 'Inter Variable', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; /* Employee IDs, optional */
```

Always enable tabular numbers on anything numeric:

```css
.num { font-variant-numeric: tabular-nums; }
```

### 3.2 Type scale (line heights are multiples of 4, mostly 8)

| Token | Size / Line | Weight | Use |
|---|---|---|---|
| `text-xs` | 12px / 16px | 500 | Badges, helper text, table captions |
| `text-sm` | 14px / 20px | 400 / 500 | **Body in tables and forms**, labels |
| `text-base` | 16px / 24px | 400 | Default body text |
| `text-lg` | 18px / 28px | 600 | Card titles |
| `text-xl` | 20px / 28px | 600 | Section headings |
| `text-2xl` | 24px / 32px | 600 | **Page titles** |
| `text-3xl` | 32px / 40px | 700 | Key figure (monthly total) |

### 3.3 Type rules

- Page title: `text-2xl`, weight 600, color neutral 900, 8px below it a `text-sm` description in neutral 600.
- Labels: `text-sm`, weight 500, neutral 700, 8px above the input.
- Never use more than three sizes in one card.
- Line length for paragraphs: 60 to 75 characters.
- Money: `text-sm` or `text-base`, weight 500, tabular numbers, right aligned in tables. Key totals use `text-3xl`.
- Letter spacing: default. Do not use all caps except `text-xs` table headers (`letter-spacing: 0.04em`, weight 600).

---

## 4. Spacing: the 8px rule

All spacing, sizing, and gaps are multiples of **8px**. A 4px half-step is allowed only for tightly related items (icon next to label, badge padding).

### 4.1 Scale

| Token | px | Typical use |
|---|---|---|
| `space-0.5` | 4 | Icon to label gap, badge vertical padding |
| `space-1` | 8 | Label to input, between inline items |
| `space-2` | 16 | Between form fields, card inner gaps |
| `space-3` | 24 | **Card padding**, grid gutter, between sections in a card |
| `space-4` | 32 | Page padding (desktop), between cards |
| `space-5` | 40 | Control height (default) |
| `space-6` | 48 | Table row height, large control |
| `space-8` | 64 | Header height, large empty-state padding |

(Tailwind equivalents: 1 unit = 4px, so `p-2` = 8px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px.)

### 4.2 Component sizes

| Element | Size |
|---|---|
| Input, select, button (default) | **40px** height |
| Small control | 32px height |
| Large control (primary page action) | 48px height |
| Control horizontal padding | 16px (small: 12px is not allowed, use 8px or 16px) |
| Table header row | 40px |
| Table body row | 48px |
| Icon (inline) | 16px or 20px (20px in buttons, 16px in table cells) |
| Icon button hit area | minimum 40px x 40px |
| Avatar / user chip | 32px |

### 4.3 Layout

| Area | Value |
|---|---|
| Header height | 64px |
| Sidebar width | 240px (collapsed 72px) |
| Page padding | 32px desktop, 16px mobile |
| Content max width | 1200px, centered |
| Grid | 12 columns, 24px gutters |
| Card padding | 24px |
| Gap between cards | 24px |
| Gap between form fields | 16px |
| Gap between a section heading and its content | 16px |
| Gap between page title block and content | 24px |

### 4.4 Breakpoints

| Name | Min width | Behavior |
|---|---|---|
| sm | 640px | Single column, drawer sidebar |
| md | 768px | Two-column forms |
| lg | 1024px | Fixed sidebar, tables full width |
| xl | 1280px | Content capped at 1200px |

---

## 5. Shape, Elevation, Motion

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 4px | Badges, checkboxes |
| `radius-md` | 8px | **Buttons, inputs, selects** |
| `radius-lg` | 12px | Cards, dialogs |
| `radius-full` | 9999px | Avatars, status dots |
| `shadow-sm` | `0 1px 2px rgba(15,23,42,0.06)` | Cards |
| `shadow-md` | `0 4px 8px rgba(15,23,42,0.08)` | Dropdowns, popovers |
| `shadow-lg` | `0 16px 32px rgba(15,23,42,0.12)` | Dialogs |
| Motion | 150ms `ease-out` | Hover, focus, dropdowns. Dialogs 200ms. Respect `prefers-reduced-motion`. The login page's decorative animations (section 7.1) are the one exception to the durations. |

Cards use a 1px `neutral-200` border plus `shadow-sm`.

**Focus ring:** 2px solid `primary-600` with a 2px offset, on every interactive element. Never remove the outline without replacing it.

---

## 6. Components

### 6.1 Buttons

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| Primary | primary-600 | white | none | Save, Add, Compute (one per view) |
| Secondary | white | neutral-900 | `border-input` | Cancel, Edit |
| Ghost | transparent | primary-600 | none | Tertiary actions, table row actions |
| Destructive (outline) | white | danger text | danger border | Remove, Delete |
| Destructive (solid) | `#B91C1C` | white | none | Confirm button in the delete dialog only |

Rules: 40px height, 16px horizontal padding, weight 500, `radius-md`. Hover darkens one step. Disabled: neutral-100 background, neutral-400 text, no pointer. Loading: spinner replaces the label width-stable, button disabled. Icon plus label gap: 8px.

### 6.2 Inputs and forms

- Label above the field (14px, weight 500), 8px gap. Required fields get a `*` in danger color plus the word "required" for screen readers.
- Input: 40px, white, 1px `border-input`, `radius-md`, text `text-sm`, placeholder neutral 500.
- Focus: border primary-600 plus the focus ring.
- Error: border danger, message below the field in `text-xs` danger color with an icon, 4px gap. Never rely on color alone.
- Disabled / read-only (Employee ID while editing): neutral-100 background, neutral-600 text.
- Money field: `₱` prefix inside the input, right aligned digits, `inputMode="decimal"`, tabular numbers, max 2 decimals. Reject negative values at input.
- Date field: native date input with `max` set to today (date hired).
- Form layout: single column on mobile, two columns from `md`, 16px field gap, actions right aligned with 8px between buttons and 24px above them.

### 6.3 Tables

- Header: 40px, neutral-100 background, `text-xs` uppercase, weight 600, neutral-600 text.
- Rows: 48px, white, 1px neutral-200 bottom border, hover neutral-50, selected primary-50 with a 2px primary-600 left border.
- Cell padding: 16px horizontal.
- **Money columns right aligned, tabular numbers, header right aligned too.** Text columns left aligned.
- Row actions in the last column: ghost icon buttons (Edit, Remove), with tooltips and aria-labels.
- Empty state inside the table area (see 6.8). Loading: skeleton rows with the same 48px height.
- On small screens, tables scroll horizontally inside their card.

### 6.4 Cards

White, 1px neutral-200 border, `radius-lg`, `shadow-sm`, 24px padding. Title `text-lg` weight 600, 16px gap to content. Optional action area top right.

### 6.5 Badges

`text-xs`, weight 500, 4px vertical and 8px horizontal padding, `radius-sm`. Use the semantic color pairs (text + background + border). "Active" is success. "Not assigned" is neutral. "Removed" (history) is neutral muted.

### 6.6 Dialogs and confirms

Max width 480px, `radius-lg`, `shadow-lg`, 24px padding, overlay `rgba(15,23,42,0.5)`. Title `text-lg`, description `text-sm` neutral 600. Buttons right aligned: Cancel (secondary), then the confirm. Destructive confirm uses the solid danger button and says exactly what happens, for example "Remove Rice Allowance from this employee? You can add it again later." Escape closes, focus is trapped, and focus returns to the trigger.

### 6.7 Toasts and alerts

- Toast (top right, 16px from edges, 8px apart): success 4s, error stays until dismissed. Use `role="status"` (success) or `role="alert"` (error).
- Inline alert (inside a card): semantic background, 1px border, 16px padding, icon plus text.
- Server `409` messages (for example "Employee ID already exists") show inline on the field, not only as a toast.

### 6.8 Empty, loading, error states

| State | Pattern |
|---|---|
| Empty | Centered in the card, 48px icon in neutral-400, title `text-lg`, one-line help `text-sm` neutral-600, one primary action. Example: "No salary assigned yet" with a button "Assign salary". |
| Loading | Skeleton blocks at the final size (no layout shift). Spinner only inside buttons. |
| Error | Alert with a short message and a Retry button. Never show raw server errors or stack traces. |

### 6.9 Navigation

**Sidebar** (240px, white, right border neutral-200; a 72px icon rail when collapsed; a drawer below `lg`).
- **Top (64px):** the logo mark and the app name on two lines ("Employee & Salary" over "Management"), with a close button in the drawer.
- **Groups:** People (Employees) and Pay (Salary, Components, Computation). The group name is a `text-xs`, weight 600, neutral-500 label in sentence case, never all caps. The header breadcrumb repeats the group.
- **Links:** 40px tall, 16px padding, 20px icon, 8px gap, 4px between links. Active: primary-50 background, primary-700 text, weight 500, plus a 3px by 24px primary-600 marker on the sidebar's left edge. Hover: neutral-100. A page that is not built yet is disabled (neutral-400, `aria-disabled`, no link) with a neutral "Soon" badge.
- **Rail (collapsed, `lg` and up only):** icons only, centered, the group names replaced by a divider, the text kept in the page for screen readers (not removed), and a dark tooltip beside the icon on hover and keyboard focus. The width change takes 200ms. The choice is saved in `localStorage` as `sidebar-collapsed` (a display preference, never a token); if storage is blocked the sidebar simply starts expanded.
- **Drawer (below `lg`):** opens from the menu button over a dimmed overlay. Focus moves to the close button; the page behind is `inert`; Escape, the overlay and the close button close it and return focus to the menu button; following a link closes it and moves focus to the page content; it closes by itself if the window grows to `lg`. The rail does not apply to the drawer, which always shows full labels.

**Header** (64px, sticky, translucent white with a light blur, bottom border neutral-200).
- **Left:** a 40px icon button (opens the drawer below `lg`; collapses or expands the sidebar from `lg`), a divider, and a breadcrumb: group, then the current page (`aria-current="page"`). Below `sm` only the page name shows.
- **Right:** the account menu. A button with a 32px avatar (initials), the name (from `sm`) and a chevron. It opens a 256px panel with the avatar, name, email, a role badge ("Administrator") and Logout. It is a real menu: focus goes to the first item, arrow keys, Home and End move between items, Escape closes and returns focus to the button, Tab and a click outside close it. It opens in 150ms.
- **Not included on purpose:** a search box or a notification bell. They would do nothing yet, and a control that does nothing is misleading. Add them with the feature that gives them a job.

---

## 7. Screen Specs

### 7.1 Login (`/login`)
Split screen from `lg` (1024px) up, form only below it.

- **Brand panel (left half, `lg` and up):** a gradient from `primary-800` to `primary-700` (white text on it is at least 6.70:1; `primary-100` text is about 6.4:1), a faint white grid that fades toward the edges, and two soft blurred circles that drift. Top: the logo mark (white tile, blue glyph) and the app name. Then the headline "Onboard people. Assign pay. See the numbers." (`text-3xl`, weight 700) and one `text-base` line of support text. Below: an illustration of what the app does, a zigzag of three white cards (employee, monthly pay breakdown, salary rates) and a peso coin. No card may cover another card's numbers.
- **Form (right half):** white, vertically centered, a column up to 400px wide. `h1` "Welcome back", a `text-sm` line under it, email, password (show/hide toggle), primary "Sign in" button full width, and a `text-xs` note: "Accounts are created by your administrator. There is no sign-up." No signup link, and no forgot-password link (the PRD excludes both).
- **Below `lg`:** the brand panel is hidden. The logo mark and app name sit above the form.
- **Errors:** generic "Invalid email or password" in an inline alert above the fields. The alert slides in and shakes on every failed attempt.
- **Illustration rules:** the drawings are SVG files in `src/assets/login/`, inlined so they use the color tokens and Inter. They show fixed sample values from the PRD worked example (never computed on the client), and they are decorative: `aria-hidden`, not focusable. Per-minute shows 4 decimals (`₱2.6672`), as in section 8.
- **Motion (this page only):** the heading, fields and button fade up in a stagger (500ms ease-out, 80ms steps); the cards bob (6 to 8s loops), the coin wobbles, the circles drift and the pay bars grow in once. The primary button lifts 1px with `shadow-md` on hover and drops back when pressed. The password eye icon cross-fades. These are decorative, so they may run longer than the 150ms of section 5. With `prefers-reduced-motion: reduce` every animation and transition completes at once with no delay, so nothing waits to appear.

### 7.1b Dashboard (`/dashboard`)
- Header: title "Dashboard" and a greeting by the viewer's clock and first name ("Good morning, Charles. Here is your team today."). It has no action button.
- Four stat cards (two columns from `sm`, four from `xl`): Total employees (with "N hired in the last 30 days"), Monthly basic payroll (the sum of current basic salaries, "Basic salary only, components not included"), Average basic salary, and Salary assigned ("9 of 12" with a thin progress bar and a warning link to Salary when anyone is missing). Each has a 40px icon chip, a `text-3xl` tabular figure that counts up once (skipped with reduced motion), and lifts 1px on hover.
- Row two (`xl`: 2/3 and 1/3, stacked below it): "Payroll by employee" (each person's basic salary as a bar and a share of the payroll, top six, bars grow in once) and "Needs attention".
- "Needs attention": employees with no basic salary. A warning border and count badge, an avatar, name, Employee ID and how long they have been waiting, and a "Set salary" button that opens `/salary?employee=<id>`. Five are shown, then "and N more". When none are missing, the card turns success-tinted with a large check and "All caught up".
- Row three (`xl`: 2/3 and 1/3, stacked below it): "Recent hires" (the five newest, with start date and salary, or a "No salary" warning badge) and "At a glance" (highest, median and lowest salary, average tenure, longest serving).
- Everything is worked out from the whole employee list, not from a search. Money is added in whole centavos, never as floats. Loading is a skeleton, an error is a plain message with Retry, and every panel has an empty state.

### 7.2 Employees (`/employees`)
- Header: title "Employees", a one-line description, and the primary "Add employee" button (plus icon) on the right. They wrap on narrow screens.
- One card (`rounded-lg`, border neutral-200, `shadow-sm`) holds the search field and the table. The search field is 40px, max `max-w-sm`, with a search icon, a visually hidden label "Search employees" and the placeholder "Search by name or Employee ID". It searches on the server 300ms after typing stops.
- Table: Employee ID (mono, weight 500), Full name, Date hired ("MMM d, yyyy"), Monthly basic salary (right aligned money, or a neutral "Not assigned" badge), and an Actions column with an icon-only Edit button (`aria-label` "Edit {full name}", tooltip "Edit"). No delete: employees are not deleted. Rows are 48px, the header 40px. The table scrolls sideways inside the card on small screens.
- Pagination below the table, 10 rows per page: "Showing 11–20 of 42" with Previous and Next. A new search returns to page 1.
- Add and Edit use one 480px dialog (6.6): Employee ID, First name, Middle name (optional), Last name, Date hired (not after today in Manila). Add starts on Employee ID; Edit starts on First name and the Employee ID is read-only with the hint "The Employee ID can't be changed." Buttons: Cancel, and "Add employee" or "Save changes" (loading while saving). A `409` shows "Employee ID already exists" under the Employee ID field; other `400` field errors show under their fields; anything else shows an alert at the top of the dialog and keeps what was typed.
- A saved change closes the dialog, shows a success toast ("Employee added" or "Employee updated"), and returns focus to the button that opened it. The list refreshes.
- States: loading is a skeleton table; no employees is an empty state with an "Add employee" action; a search with no match says so and offers "Clear search"; a load error shows a plain message (never the raw server text) with Retry.

### 7.3 Salary (`/salary`)
- Header: title "Salary" and a one-line description. Below it the employee picker (`max-w-sm`), a searchable combobox (type to filter by name or Employee ID, arrow keys, Enter to choose, Escape to close). The chosen employee is kept in the address (`/salary?employee=<id>`), so a refresh or a shared link keeps it. Until one is chosen, an empty state says "Choose an employee".
- Two cards side by side from `lg` (stacked below it): "Current basic salary" (large figure, `text-3xl`, tabular, with "per month, since {date}"; "No salary assigned yet" when none) and the form.
- Form: titled "Assign salary" or "Adjust salary". One money field with a fixed peso sign (label "Monthly basic salary", or "New monthly basic salary" when adjusting), checked as text: greater than 0, at most 2 decimals, at most ₱99,999,999.99. Button "Assign salary" or "Save salary". The hint says the current salary is kept in the history. The same amount as the current salary is refused inline ("This is already the current salary").
- A save shows a toast ("Salary assigned" or "Salary updated"; an info toast "Salary is already ₱X. Nothing changed." if the server sees no change), clears the field, and refreshes the Employees list and the computation.
- Card "Salary history": table of previous salaries (amount, assigned, replaced), newest first; a short note when there are none. Dates are shown as the Manila date.
- States: loading skeletons, a plain error with Retry, a field-level API error under the field, any other save failure as an alert inside the form that keeps the typed amount.

### 7.4 Salary Components (`/components`)
- Employee picker.
- Add form: component combobox (type to search existing names or create a new one), amount, "Add component".
- Table: Component, Amount (right aligned), actions (Edit amount, Rename, Remove). Rename shows a note: "Applies to all employees using this component."
- Duplicate error inline: "This employee already has this component."

### 7.5 Computation (`/computation`)
- Employee picker.
- Breakdown card: rows for Basic salary, each component, and a **Total monthly salary** row (primary-50 background, weight 600, top border).
- Rates card: four rows (Annual, Daily, Hourly, Per-minute), each with the formula in `text-xs` neutral 600 (for example "Annual ÷ 314") and the value right aligned. Footer note: "Daily rate uses 314 working days per year."
- If no salary: empty state with a link to the Salary page.
- Updates automatically when salary or components change (query invalidation).

---

## 8. Money and Data Display

- Format with `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`. Example: `₱33,500.00`.
- Annual, daily, hourly: 2 decimals. **Per-minute: 4 decimals** (`₱2.6672`).
- API sends amounts as strings. Format for display only. Never do arithmetic with floats on the client, and never compute rates on the client.
- Dates: `MMM d, yyyy` (for example "Nov 13, 2026").
- Employee ID is shown in `--font-mono` or weight 500, never wrapped.

---

## 9. Accessibility Checklist

- All text meets the contrast table above.
- Every interactive element has a visible focus ring and works with keyboard (Tab, Enter, Space, Escape).
- Inputs have visible labels (placeholders are not labels). Errors are linked with `aria-describedby`.
- Icon-only buttons have `aria-label`.
- Tables use real `<table>`, `<th scope>` and a caption or `aria-label`.
- Do not use color alone to show status or errors.
- Touch targets at least 40px.
- Respect `prefers-reduced-motion`.
- Page has one `h1` (the page title), headings in order.

---

## 10. Implementation Tokens

### 10.1 CSS variables (`src/styles/tokens.css`)

```css
:root {
  /* Color */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;

  --color-neutral-0: #ffffff;
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-900: #0f172a;
  --color-border-input: #7c8798;

  --color-success: #15803d;  --color-success-bg: #f0fdf4;  --color-success-border: #bbf7d0;
  --color-warning: #b45309;  --color-warning-bg: #fffbeb;  --color-warning-border: #fde68a;
  --color-danger:  #b91c1c;  --color-danger-bg:  #fef2f2;  --color-danger-border:  #fecaca;
  --color-danger-hover: #991b1b;
  --color-info:    #0369a1;  --color-info-bg:    #f0f9ff;  --color-info-border:    #bae6fd;

  /* Typography */
  --font-sans: 'Inter Variable', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  /* Spacing (8px base) */
  --space-0-5: 4px;
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 40px;
  --space-6: 48px;
  --space-8: 64px;

  /* Shape and elevation */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 4px 8px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 16px 32px rgba(15, 23, 42, 0.12);

  /* Layout */
  --header-height: 64px;
  --sidebar-width: 240px;
  --content-max: 1200px;
  --control-height: 40px;
  --row-height: 48px;
}

body {
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 24px;
  color: var(--color-neutral-900);
  background: var(--color-neutral-50);
}

.num { font-variant-numeric: tabular-nums; }
```

### 10.2 Tailwind mapping (if you use Tailwind)

```ts
// tailwind.config.ts (theme.extend)
colors: {
  primary: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af' },
  success: { DEFAULT: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  warning: { DEFAULT: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  danger:  { DEFAULT: '#b91c1c', bg: '#fef2f2', border: '#fecaca', hover: '#991b1b' },
  info:    { DEFAULT: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  field:   '#7c8798',
},
fontFamily: { sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'] },
borderRadius: { sm: '4px', md: '8px', lg: '12px' },
height: { control: '40px', row: '48px', header: '64px' },
```

Tailwind's default `slate` palette already matches the neutral tokens above (50, 100, 200, 400, 500, 600, 700, 900), so use `slate-*` for neutrals. Tailwind spacing steps are 4px, so use only steps 2, 4, 6, 8, 10, 12, 16 (8, 16, 24, 32, 40, 48, 64px), and 1 only for the 4px half-step.

---

## 11. Do and Don't

| Do | Don't |
|---|---|
| One primary button per view | Several competing blue buttons |
| Right align money with tabular numbers | Center or left align amounts |
| Use spacing tokens (multiples of 8) | Use arbitrary values like 10px, 13px, 18px |
| Show errors next to the field with text | Show only a red border |
| Confirm before remove or delete, and say what happens | Delete on a single click |
| Use skeletons that match the final layout | Show a blank screen or a page-wide spinner |
| Keep text at neutral-500 or darker | Use neutral-400 for readable text |
| Format money with `formatPeso()` | Concatenate `"₱" + number` by hand |