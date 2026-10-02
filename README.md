# Cashflow Copilot

Personal cash-flow app for signing in, recording income and expenses, and reviewing monthly totals, category spending, and a running balance. Habits, notes, and settings are present in the navigation and in the database, and are not implemented as product features yet.

## Overview

The app is a [Next.js](https://nextjs.org) 16 App Router project. Authenticated users land on a dashboard. Transactions belong to a workspace owned by the user. Categories are a shared catalog, not owned by a workspace.

Money is stored as `CREDIT` (income) and `DEBIT` (expense). Display formatting uses Indian rupees (`en-IN`).

What works today:

- Sign up, log in, log out
- Cookie session checked by `src/middleware.ts` on page routes
- Create, list, update, and delete transactions
- Finance summary cards and a per-category breakdown
- Dashboard charts for income vs expense, spending by category, and balance trend
- Habit count and note count on the dashboard (the habit “streak” is a placeholder)

What is not a working product surface yet:

- Habits, notes, and settings pages render “Coming Soon”
- There are no habit or note API routes
- There is no workspace switcher and no category management UI
- `User.role` (`USER` | `ADMIN`) is stored and unused by the app

## Tech Stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16.3.4 (App Router, `src/`) |
| UI | React 19, Tailwind CSS 4 |
| Data fetching | TanStack Query 5 |
| Tables | TanStack Table 8 |
| Charts | Recharts 3 |
| Icons | lucide-react |
| Database | PostgreSQL through Prisma 7 and the Neon serverless driver |
| Auth | bcryptjs password hashes, jsonwebtoken, HTTP-only `token` cookie |
| Language | TypeScript (`strict: true`) |
| Lint | ESLint 9 with `eslint-config-next` |

There is no component library such as shadcn, no Zod, and no React Hook Form. Validation is handwritten.

## Project Architecture

Request path that the implemented features actually use:

```text
Browser UI (client pages and feature components)
  → TanStack Query hooks
    → client fetch helpers
      → Route Handlers in src/app/api
        → Prisma client (src/lib/prisma.ts)
          → Neon PostgreSQL
```

There is no `services/` or `repositories/` layer. Route handlers talk to Prisma directly.

Page access control is separate from API access control:

- `src/middleware.ts` redirects unauthenticated visits to `/`, `/dashboard`, `/login`, and `/signup` based on whether a `token` cookie exists. It does not verify the JWT.
- Protected API routes call `requireUserId()` in `src/lib/auth.ts`, which verifies the JWT.

`src/middleware.ts` is the current auth gate. Next.js 16 prints a deprecation warning that the `middleware` file convention should move to `proxy`. That migration has not been done.

### Authentication

```text
Login / signup page
  → fetch POST /api/auth/login or /api/auth/signup
    → Prisma User
      → login sets an HTTP-only JWT cookie
```

Signup creates a `User` and returns `201`. It does not set a session and does not create a workspace. The login page is the next step.

The sidebar reads the session through `useCurrentUser` → `GET /api/auth/me`.

### Transactions

```text
/dashboard/finance
  → useListQueryState + useTransactions / mutations
    → src/features/finance/api/finance-api.ts
      → /api/finance/transactions
        → validateTransactionData
          → Prisma Transaction, scoped with workspace.userId
```

The signed-in user’s id comes from the JWT. The client does not send `userId` or `workspaceId`. On create, the handler uses the user’s first workspace, or creates one named `Personal Workspace`.

### Dashboard

```text
/dashboard
  → useDashboardMetrics, useCashflow, useBalanceTrend, useFinanceSummary, useCategorySummary
    → /api/dashboard/* , /api/finance/summary , /api/categories/summary
      → Prisma
```

Charts are loaded with `next/dynamic` and `ssr: false`.

### Categories

```text
CategorySelect / filters / CategoryStatsTooltip / CategoryDonutChart
  → useCategories or useCategorySummary
    → /api/categories or /api/categories/summary
      → Prisma Category (global rows)
```

### Habits and notes

Models exist. The only runtime use is `GET /api/dashboard/metrics`, which counts rows. If the user has any habit, the streak value returned is the constant `5`. Pages at `/dashboard/habits` and `/dashboard/notes` are placeholders.

## Folder Structure

```text
prisma/
├── schema.prisma
├── seed.ts
├── seed-transactions.ts
└── migrations/
src/
├── app/                  # routes, layouts, route handlers
├── components/
│   ├── layout/
│   ├── providers/
│   └── ui/
├── features/
│   ├── auth/
│   ├── dashboard/
│   └── finance/
├── hooks/
│   └── list/
├── lib/
├── resources/            # shared category catalog UI and data
└── middleware.ts
public/                   # default Next.js SVGs; unused by app code
github/workflows/ci.yml   # not the path GitHub Actions reads
```

The Prisma client is generated to `src/generated/prisma` and imported as `@/generated/prisma`. That folder is gitignored. Run `npx prisma generate` after install.

`@/*` maps to `./src/*` (`tsconfig.json`).

### `src/app/`

Next.js routes and route handlers. A folder with `page.tsx` is a URL. A folder under `api/` with `route.ts` is an HTTP endpoint.

Do not put feature UI, shared buttons, or Prisma setup here. Pages compose features. Handlers authenticate, validate, and query Prisma.

Example: `src/app/dashboard/finance/page.tsx` is the ledger screen. `src/app/api/finance/transactions/route.ts` is the list and create API.

### `src/features/`

Feature-owned UI, hooks, client API helpers, and types.

```text
features/
├── auth/
│   ├── api/get-current-user.ts
│   ├── hooks/use-current-user.ts
│   └── types.ts
├── dashboard/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   └── types/
└── finance/
    ├── api/finance-api.ts
    ├── components/
    ├── hooks/
    ├── lib/validate-transaction.ts
    └── types/
```

`finance/lib/validate-transaction.ts` is called by route handlers, so it must stay free of browser-only APIs.

Do not put shared buttons or the Prisma singleton here. Feature code that more than one product area needs (categories) lives in `src/resources/`.

Barrel files: `src/features/auth/index.ts`, `src/features/dashboard/index.ts`, `src/features/finance/index.ts`. `useFinanceSummary` is not exported from the finance barrel; `FinanceStats` imports it from the hook file.

### `src/resources/`

Shared category catalog: types, `categories-api.ts`, hooks, `CategorySelect`, `CategoryBadge`, and `CategoryStats`.

Categories are global. They are not a workspace feature module.

### `src/components/`

Shared presentation pieces.

- `ui/` — `Button`, `Input`, `Select`, `Modal`, `ConfirmDialog`, `DataTable`, `StatCard`
- `layout/DashboardShell.tsx` — sidebar and sign-out
- `providers/ReactQueryProvider.tsx` — TanStack Query client

Do not put transaction rules or Prisma calls here.

### `src/hooks/`

Cross-feature React hooks: `useDebounce`, `useDebouncedSearch`, and list state (`useFilters`, `usePagination`, `useSort`, `useListQueryState`).

`useListQueryState` currently drives the finance table. A comment at the top of that file describes a future habits list; that caller does not exist.

### `src/lib/`

- `prisma.ts` — singleton Prisma client with `PrismaNeon`
- `auth.ts` — `JWT_SECRET`, `getSession`, `requireUserId`
- `api-client.ts` — `apiFetch` for browser calls
- `cn.ts` — join class names

### `prisma/`

Schema, SQL migrations, category seed, and an optional transaction seed script.

## Architecture / Data Flow

| Feature | UI | Client hook | Client fetch | Route | Database |
| --- | --- | --- | --- | --- | --- |
| Log in | `src/app/login/page.tsx` | local `useState` | `fetch` | `POST /api/auth/login` | `User` |
| Sign up | `src/app/signup/page.tsx` | local `useState` | `fetch` | `POST /api/auth/signup` | `User` |
| Current user | `DashboardShell` | `useCurrentUser` | `apiFetch` | `GET /api/auth/me` | `User` |
| Sign out | `DashboardShell` | — | `fetch` | `POST /api/auth/logout` | clears cookie |
| Transactions | `dashboard/finance/page.tsx` | `useTransactions` and mutations | `apiFetch` | `/api/finance/transactions` | `Transaction` |
| Finance totals | `FinanceStats` | `useFinanceSummary` | `apiFetch` | `GET /api/finance/summary` | `Transaction` grouped by type |
| Categories | selects and badges | `useCategories` | `apiFetch` | `GET /api/categories` | `Category` |
| Category totals | `CategoryStats`, donut chart | `useCategorySummary` | `apiFetch` | `GET /api/categories/summary` | `Category` + `Transaction` |
| Habit / note counts | dashboard metric cards | `useDashboardMetrics` | `fetch` | `GET /api/dashboard/metrics` | `Habit`, `Note` |
| Cash flow chart | `CashflowChart` | `useCashflow` | `fetch` | `GET /api/dashboard/cashflow` | `Transaction` |
| Balance chart | `BalanceTrendChart` | `useBalanceTrend` | `fetch` | `GET /api/dashboard/balance-trend` | `Transaction` |

Dashboard fetch helpers (`get-dashboard-data.ts`, `get-cashflow.ts`, `get-balance-trend.ts`) use `fetch` directly. Finance, auth, and categories use `apiFetch`.

Query keys:

- `['current-user']`
- `['transactions', params]` and `['transactions', 'summary', range]`
- `['categories']` and `['transactions', 'category-summary', range]`
- `['dashboard-metrics']`, plus `cashflow` and `balance-trend` suffixes

Transaction create, update, and delete invalidate `['transactions']` and `['dashboard-metrics']`. Summary and category-summary keys start with `transactions`, so those queries refresh too. `useCashflow` and `useBalanceTrend` also start with `dashboard-metrics`, so they refresh on the same invalidation.

## Feature Modules

### Auth

Location: `src/features/auth`, `src/app/login`, `src/app/signup`, `src/app/api/auth`, `src/lib/auth.ts`, `src/middleware.ts`.

Responsibilities: hash passwords (bcrypt, cost 10), issue a 7-day JWT (`userId`, `email`), store it in an HTTP-only cookie named `token` (`sameSite: 'strict'`, `secure` in production), return `{ id, name, email }` from `/api/auth/me`.

### Finance

Location: `src/features/finance`, `src/app/dashboard/finance/page.tsx`, `src/app/api/finance`.

Responsibilities: paginated, sorted, filtered ledger; create, edit, delete; all-time and month totals.

Rules in `validateTransactionData`:

- Amount must be a positive number, rounded to 2 decimals
- Type must be `CREDIT` or `DEBIT`
- Description is optional, trimmed, and at most 255 characters
- `categoryId` must be a string or it is stored as `null`
- Route handlers also check that the category id exists

List query parameters: `page`, `limit` (default 20, max 100), `sortBy` (`createdAt`, `amount`, `description`, `type`), `sortDir`, `type`, `categoryId`, `search` (case-insensitive description match), `dateFrom`, `dateTo` (`YYYY-MM-DD`). Rows are limited to workspaces whose `userId` is the session user. Update and delete return 404 when that check fails.

The finance page keeps list state in `useListQueryState` (in-memory, not the URL).

`FinanceStats` accepts boolean props (`totalIncome`, `totalExpense`, `netBalance`, `thisMonthNet`, `lastMonthNet`) so the dashboard and finance page can hide cards. Defaults are all `true`. The dashboard hides income and expense totals. The finance page hides the three net cards.

### Dashboard

Location: `src/features/dashboard`, `src/app/dashboard/page.tsx`, `src/app/api/dashboard`.

- Metric cards: placeholder habit streak and note count
- Bar chart: monthly income vs expense. Query `months` is `3`, `6`, `12`, `24`, or `all` (capped at 60 months). Default `6`.
- Area chart: running balance. Query `days` is a positive integer or `all` (capped at 730 days). Default `30`. Opening balance includes transactions before the window.
- Donut chart: top five expense categories plus an “Other” slice, using `useCategorySummary`

`/dashboard` layout wraps children in `DashboardShell`. `/` redirects to `/dashboard`.

### Categories

Location: `src/resources`, `src/app/api/categories`.

Read-only HTTP API. Rows are seeded by `prisma/seed.ts` (14 shared names and colors). `GET /api/categories` sets `Cache-Control: private, max-age=300`. Summary accepts optional `gte` and `lt` and returns categories that have transactions in range, sorted by transaction count.

`useCategoryMap` and `useCategorySummaryMap` are exported and have no callers.

### Habits, notes, settings

Not yet implemented as features.

- Schema: `Habit`, `HabitLog`, `Note`
- Pages: `src/app/dashboard/habits/page.tsx`, `notes/page.tsx`, `settings/page.tsx` show placeholder copy
- Sidebar links exist in `DashboardShell`

### Workspace

Schema and ownership exist. There is no workspace feature module.

A user can own many workspaces. The app always uses `findFirst` and never lets the user pick one. The create-on-demand name is `Personal Workspace`. The transaction seed script uses `Personal` when it has to create a workspace.

## Database Architecture

Provider: PostgreSQL. ORM: Prisma 7. Connection URL lives in `prisma.config.ts` (`DATABASE_URL`), not inside the `datasource` block. Runtime access uses `@prisma/adapter-neon` and `@neondatabase/serverless` with the `ws` WebSocket constructor.

```text
User
├── Workspace
│     └── Transaction ── optional ── Category
├── Habit
│     └── HabitLog
└── Note
```

`Category` is global. It is not a child of `User` or `Workspace`.

| Model | Notes |
| --- | --- |
| `User` | `id` UUID, unique `email`, hashed `password`, optional `name`, `role` default `USER` |
| `Workspace` | `name`, `userId`. Delete cascades from the user |
| `Category` | unique `name`, optional `color` |
| `Transaction` | `amount` float, `type` default `DEBIT`, optional `description`, required `workspaceId`, optional `categoryId` |
| `Habit` | `title`, `userId`. No API yet |
| `HabitLog` | `completed` default false, `date`, `habitId`. No API yet |
| `Note` | `title`, optional `content`, `userId`. No API yet |

Enums: `Role` (`USER`, `ADMIN`), `TransactionType` (`CREDIT`, `DEBIT`).

Constraints and indexes:

- Unique: `User.email`, `Category.name`
- Indexes: `Transaction.workspaceId`, `Transaction.categoryId`
- `Workspace.user` and `Habit.user` and `Note.user`: `onDelete: Cascade`
- `Transaction.workspace`: `onDelete: Cascade`
- `Transaction.category`: `onDelete: SetNull`
- `HabitLog.habit`: `onDelete: Cascade`

Committed migrations:

1. `20260910175610_init_user_model`
2. `20260912174912_add_dashboard_models`
3. `20260921070315_add_category_and_user_role`

`ActivityItem` in `src/features/dashboard/types/index.ts` is unused. It is not a database model.

## Authentication & Authorization

Session: JWT in the `token` cookie. `getSession` returns `{ userId, email }` or `null`. Invalid or missing tokens fail closed on API routes that call `requireUserId`.

| Route | Auth |
| --- | --- |
| `POST /api/auth/signup` | public |
| `POST /api/auth/login` | public |
| `POST /api/auth/logout` | clears the cookie; does not require a valid JWT |
| `GET /api/auth/me` | session required |
| `/api/finance/*`, `/api/categories/*`, `/api/dashboard/*` | session required |

Transaction queries always add `workspace: { userId }`. The handler does not trust an id from the body for ownership.

`Role.ADMIN` is not checked anywhere. Any signed-in user can read every category. Category rows are global.

Middleware only tests cookie presence, so a garbage `token` value still passes the page gate. API routes then return `401`.

Passwords are never selected in `/api/auth/me`.

## State Management & Data Fetching

Server state is TanStack Query, provided from the root layout. Defaults: `staleTime` 5 minutes, `refetchOnWindowFocus: false`.

Overrides: current user and categories use a 10 minute stale time. Categories also set `gcTime` to 30 minutes. The transaction list, cash-flow chart, and balance-trend queries set `placeholderData: keepPreviousData` so the previous result stays visible while filters or ranges change. `useFinanceSummary` does not.

UI state (forms, dialogs, chart ranges, table page) is `useState`. List filters are not written to the URL.

Auth forms call `fetch` and then `router.push`. They do not use React Query.

## API Architecture

JSON in and out. Errors are `{ error: string }` with `400`, `401`, `404`, or `500`. Handlers log with `console.error` and return a generic 500 message.

`apiFetch` (`src/lib/api-client.ts`) sets `Content-Type: application/json`, throws `Error` using the response `error` field, and treats an empty body as `{}`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create user |
| POST | `/api/auth/login` | Verify password, set cookie |
| POST | `/api/auth/logout` | Clear cookie |
| GET | `/api/auth/me` | Current user |
| GET | `/api/finance/transactions` | Paginated ledger |
| POST | `/api/finance/transactions` | Create transaction |
| PATCH | `/api/finance/transactions/[id]` | Update transaction |
| DELETE | `/api/finance/transactions/[id]` | Delete transaction |
| GET | `/api/finance/summary` | Totals for all time, this month, last month |
| GET | `/api/categories` | Category catalog |
| GET | `/api/categories/summary` | Per-category income, expense, net, count |
| GET | `/api/dashboard/metrics` | Habit streak placeholder and note count |
| GET | `/api/dashboard/cashflow` | Monthly income and expense |
| GET | `/api/dashboard/balance-trend` | Daily running balance |

Month boundaries for `/api/finance/summary` are `lastMonthStart`, `thisMonthStart`, and `nextMonthStart`, sent by the browser so “this month” follows the user’s timezone. The route rejects an inverted range. If the query params are omitted, it falls back to server-local month boundaries.

There is no route to create or edit categories, habits, notes, or workspaces.

## Shared Components

| Component | Role |
| --- | --- |
| `Button` / `PrimaryButton` | `primary`, `secondary`, `danger`, `ghost`; sizes `sm`, `md`, `lg`; `loading` and `leftIcon` |
| `Input`, `Select` | Styled form controls |
| `Modal` | Dialog shell used by the transaction form |
| `ConfirmDialog` | Sign-out and delete confirmation |
| `DataTable` | TanStack Table with server-driven pagination, sort, and debounced search |
| `StatCard` | Presentational metric. Callers pass an already formatted value |
| `DashboardShell` | Sidebar navigation, user chip, sign-out |
| `ReactQueryProvider` | Query client |

`cn` is used by `Button` and `Modal`.

## Hooks

Feature hooks:

- `useCurrentUser`
- `useTransactions`, `useCreateTransaction`, `useUpdateTransaction`, `useDeleteTransaction`
- `useFinanceSummary`
- `useDashboardMetrics`, `useCashflow`, `useBalanceTrend`
- `useCategories`, `useCategoryMap`, `useCategorySummary`, `useCategorySummaryMap`

Shared hooks:

- `useDebounce`, `useDebouncedSearch` (used by `DataTable`, default delay 400ms)
- `useListQueryState` and its `useFilters`, `usePagination`, `useSort` pieces

## Utilities / Lib

| File | Role |
| --- | --- |
| `src/lib/prisma.ts` | Throws if `DATABASE_URL` is missing. Logs queries. Reuses one client outside production |
| `src/lib/auth.ts` | Throws if `JWT_SECRET` is missing when a session is read |
| `src/lib/api-client.ts` | Browser helper for JSON fetches |
| `src/lib/cn.ts` | Class string join |
| `src/features/finance/lib/validate-transaction.ts` | Shared create/update validation |
| `src/features/dashboard/components/chart-utils.ts` | INR formatting and `YYYY-MM-DD` dates |

## Environment Variables

There is no `.env.example`. `.gitignore` ignores `.env*`. Create a local `.env` yourself. Do not commit it.

| Variable | Required | Scope | Used for |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Server only | Prisma config, `src/lib/prisma.ts`, seed scripts. Neon Postgres connection string |
| `JWT_SECRET` | Yes | Server only | Signing and verifying the session JWT (`src/lib/auth.ts`) |
| `NODE_ENV` | Set by Next.js / Node | Server | `secure` cookie flag; Prisma client caching |
| `SEED_USER_EMAIL` | No | Seed script only | Default user for `prisma/seed-transactions.ts` when no email argument is passed |

Nothing in the app uses a `NEXT_PUBLIC_` variable. `JWT_SECRET` and `DATABASE_URL` must not be exposed to the client.

`prisma.config.ts` and both seed files import `dotenv/config`. `dotenv` is not listed in `package.json`. It is installed transitively through Prisma (`@prisma/config` → `c12` → `dotenv`). If a seed script fails to resolve that module, install `dotenv` as a dev dependency.

## Local Development Setup

Requirements: Node.js, npm, and a Postgres database. Prisma 7.10 declares Node `^20.19 || ^22.12 || >=24.0`. The CI workflow file installs Node 22. The Prisma client is wired for Neon’s serverless driver.

```bash
git clone https://github.com/adarshdev26/ai-cashflow-copilot.git
cd ai-cashflow-copilot
npm install
```

Create `.env` in the project root:

```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="long-random-string"
```

Apply the committed migrations and generate the client (output: `src/generated/prisma`):

```bash
npx prisma migrate dev
npx prisma generate
```

`prisma generate` is also needed on a fresh install because the generated client is not committed. `migrate dev` generates it as part of a normal Prisma workflow; run `generate` on its own when the schema is already applied.

Seed the shared categories (configured as the Prisma seed command `tsx prisma/seed.ts`):

```bash
npx prisma db seed
```

Optional transaction history for one existing user. Register that user in the app first, or pass their email:

```bash
npx tsx prisma/seed-transactions.ts you@example.com
npx tsx prisma/seed-transactions.ts you@example.com --clear
```

`--clear` deletes that workspace’s transactions before inserting. Categories must already be seeded.

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `/` redirects to `/dashboard`, and middleware sends an anonymous visitor to `/login`.

## Available Scripts

From `package.json`:

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `next dev` | Development server |
| `build` | `next build` | Production build and type check |
| `start` | `next start` | Serve a production build |
| `lint` | `eslint` | ESLint (`eslint.config.mjs`, Next.js core-web-vitals and TypeScript configs) |
| `typecheck` | `tsc --noEmit` | TypeScript without emit |

There is no `test` script. There are no test files.

Prisma commands are not wrapped in npm scripts. Use `npx prisma migrate dev`, `npx prisma generate`, and `npx prisma db seed`.

## Development Guidelines

These match how the code is organized today.

- Add a product area under `src/features/<name>` with `components`, `hooks`, `api`, and `types` when it owns its own screens.
- Put cross-feature UI in `src/components`. Put the category catalog in `src/resources`.
- Keep route handlers in `src/app/api`. Call Prisma there or through a shared validator. Do not import `src/lib/prisma.ts` into client components.
- Read the user id from `requireUserId()`. Scope transactions with `workspace: { userId }`.
- Validate amounts, types, dates, and sort fields before writing. Return `{ error }` and a 4xx status.
- Use TanStack Query for data that already flows through hooks. Invalidate `['transactions']` or `['dashboard-metrics']` when those caches must refresh.
- Client pages that use hooks declare `'use client'`. Layouts and route handlers stay server-side.
- Import application modules with `@/`.
- Currency displayed in this app is INR. Keep that consistent unless the product adds a currency field.
- Run `npm run lint` and `npm run typecheck` before a pull request. `npm run build` type-checks again.

Conventions that are inconsistent:

- Quotes and semicolons vary by file. Both styles are already in the tree.
- Feature files are mostly kebab-case (`use-finance.ts`, `finance-api.ts`). Shared hooks are camelCase (`useDebounce.ts`). React components are PascalCase.
- Some hooks return data through `apiFetch`; dashboard hooks use raw `fetch`.
- `src/app/api/auth/signup/route.ts` imports Prisma with a relative path. Other routes use `@/lib/prisma`.
- Signup’s comment says a default workspace is created. The handler only creates a `User`.

Recommended follow-ups, not current rules enforced by tooling:

- Add `.env.example` with the variable names and no secret values.
- Add a `test` script or remove that step from the CI workflow.
- Move `github/workflows/ci.yml` to `.github/workflows/ci.yml` if GitHub Actions should run.
- Fix the `DateRange` mismatch that fails `next build` (see Known Issues).

## Git Workflow

Remote: `https://github.com/adarshdev26/ai-cashflow-copilot.git`. Default branch: `main`.

Recent history includes feature work merged through pull requests (for example `feature/dashboard-combined`) and direct commits on `main`. There is no `CONTRIBUTING` guide, issue template, or PR template in the repository.

A practical flow that matches the existing CI intent:

1. Branch from `main`.
2. Keep application changes focused.
3. Open a pull request into `main`.
4. The workflow file is written to run lint, typecheck, a test script, and build on pull requests targeting `main`.

That workflow file is at `github/workflows/ci.yml`. GitHub Actions only loads `.github/workflows/`. Until the file is moved, pull requests do not run it.

## CI/CD

Intended job (`quality` on `ubuntu-latest`, Node 22, `npm ci`):

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build`

`npm run test` is not defined, so this job fails as soon as it reaches that step even after the workflow path is corrected.

There is no deploy job.

## Deployment

No `vercel.json`, Dockerfile, or other deployment config is committed. `.vercel` is gitignored, which only means the Vercel CLI directory is not tracked.

To run a production build locally:

```bash
npm run build
npm run start
```

The production process needs `DATABASE_URL` and `JWT_SECRET`. `NODE_ENV=production` makes the auth cookie `secure` and stops caching the Prisma client on `globalThis`.

The last `npm run build` in this workspace failed type checking. See Known Issues. A failing type check blocks `next build`.

Preview versus production is not configured in this repository.

## Testing

Not yet implemented. No test runner is listed in `package.json`. The CI file calls `npm run test` anyway.

## Current Features

- Email and password accounts
- Dashboard shell with overview, finance, and placeholder links
- Transaction ledger with search, type, category, date filters, sort, and pagination
- Transaction create, edit, and delete
- Income, expense, and net summary cards
- Category filter, badge, select, and all-time category totals table
- Income vs expense, category spending, and balance trend charts

## Planned / Not Yet Implemented

Labeled from placeholders, unused schema, and comments in the code. These are not built screens.

- Habit tracking and habit logs (schema and nav only; streak is a constant)
- Notes (schema, count, and nav only)
- Settings (nav and page shell only)
- Workspace selection (schema only; one implicit workspace)
- Category create/edit API and UI
- Admin behavior for `User.role`
- Activity feed (`ActivityItem` type only)
- Font switching: `globals.css` defines `html[data-font]` for Inter, DM Sans, and Bricolage Grotesque. Nothing sets `data-font`. The active font variable defaults to DM Sans. The comment in that file says the default is Inter.
- Automated tests
- A GitHub Actions workflow that actually sits in `.github/workflows/`

## Troubleshooting

**Build fails in `CategoryDonutChart.tsx` (`dateFrom` does not exist on `DateRange`).** `DateRange` in `src/resources/types/index.ts` is `{ gte?: string; lt?: string }`. `useCategorySummary` and `GET /api/categories/summary` read `gte` and `lt`. `buildRange` in the donut chart assigns `dateFrom` and `dateTo`. `next build` type-checks this file and fails. Period filters on that chart do not match the API query contract.

**Redirect loop or unexpected login redirect.** Middleware treats any `token` cookie as logged-in for `/login` and `/signup`, and any missing cookie as logged-out for `/` and `/dashboard`. API calls still verify the signature.

**`DATABASE_URL is required` or `JWT_SECRET is missing`.** Both must be set before the Prisma client or session code loads. Prisma loads `.env` through `dotenv/config` in `prisma.config.ts`.

**Empty categories.** Run `npx prisma db seed`. Transaction seed throws if no categories exist.

**Transaction seed cannot pick a user.** Pass an email, set `SEED_USER_EMAIL`, or keep exactly one user in the database.

**Dashboard habit streak shows 5.** `GET /api/dashboard/metrics` returns `5` when `habit.count > 0`, and `0` otherwise. It does not read `HabitLog`.

## Known Issues / Areas for Improvement

- Production build is currently broken by the `DateRange` field names in `CategoryDonutChart`.
- Donut-chart comment in `use-categories.ts` mentions `GET /api/finance/categories/summary`. The implemented route is `GET /api/categories/summary`.
- CI workflow path is `github/workflows/ci.yml`, so Actions will not see it, and the test step has no script.
- Root metadata in `src/app/layout.tsx` is still the create-next-app title: “Create Next App”.
- Signup does not create the workspace the comment describes.
- Middleware does not verify JWTs.
- `Role` is unused.
- Two different default workspace names (`Personal Workspace` vs `Personal`).
- `public/` still has the unused `file.svg`, `window.svg`, and `vercel.svg` assets from the Next.js starter.
- No `.env.example`.

## Contributing

Clone the repo, follow Local Development Setup, and keep new feature code inside `src/features`, shared UI inside `src/components`, and HTTP handlers inside `src/app/api`. Prefer the existing Prisma and TanStack Query paths over a new data layer.

Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
npm run build
```

`build` is the check that currently fails on the category donut types. Fix that before treating the branch as mergeable.
