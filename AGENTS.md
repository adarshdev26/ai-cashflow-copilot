<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CashFlow Copilot agent instructions

Follow the code that is already in the repo. Do not add a service layer, repository layer, Zod, React Hook Form, or a component library. Do not treat habits, notes, settings, admin role, or workspace switching as implemented features.

## Project architecture

Next.js 16 App Router lives in `src/`. Path alias `@/*` maps to `src/*`.

```text
Browser UI
  → TanStack Query hooks
    → client fetch helpers
      → src/app/api route handlers
        → Prisma (src/lib/prisma.ts)
          → Neon PostgreSQL
```

Route handlers call Prisma directly. Keep new server logic there, or in an existing feature validator such as `src/features/finance/lib/validate-transaction.ts`.

`/` redirects to `/dashboard`. `src/middleware.ts` gates pages. It is deprecated by Next.js 16 in favor of `proxy`, and that migration has not been done. Do not rename it unless asked.

## Feature organization

| Path | What belongs there |
| --- | --- |
| `src/features/auth` | Current-user hook, client fetch, `CurrentUser` type |
| `src/features/finance` | Ledger UI, transaction hooks, `finance-api.ts`, transaction types, `validate-transaction.ts` |
| `src/features/dashboard` | Metric and chart UI, dashboard hooks, chart fetch helpers, dashboard types |
| `src/resources` | Shared global category catalog: API helper, hooks, `CategorySelect`, `CategoryBadge`, `CategoryStats` |
| `src/app` | Pages, layouts, and route handlers only |
| `src/components` | Shared UI, `DashboardShell`, `ReactQueryProvider` |
| `src/hooks` | Cross-feature hooks (`useDebounce`, `useDebouncedSearch`, `src/hooks/list/*`) |
| `src/lib` | `prisma`, `auth`, `apiFetch`, `cn` |

Feature files are mostly kebab-case (`use-finance.ts`, `finance-api.ts`). Shared hooks are camelCase (`useDebounce.ts`). Components are PascalCase. Match the folder you are editing.

Re-export from the feature `index.ts` only when that barrel already exports the same kind of symbol. `useFinanceSummary` is imported from its hook file, not from `@/features/finance`.

Habits, notes, and settings pages are placeholders. `Habit`, `HabitLog`, and `Note` exist in Prisma only. Do not build those features unless asked.

## Components

- Shared controls: `Button` / `PrimaryButton`, `Input`, `Select`, `Modal`, `ConfirmDialog`, `DataTable`, `StatCard`.
- `StatCard` receives an already formatted value. Format money in the caller with `en-IN` and INR, matching `FinanceStats` and `chart-utils.ts`.
- `DataTable` is the table primitive. Transaction lists pass server pagination, sorting, and filtering through it.
- Screens compose features. `src/app/dashboard/finance/page.tsx` and `src/app/dashboard/page.tsx` are the pattern.
- Do not put Prisma or auth secrets in components.

## Hooks

- Server state goes through TanStack Query.
- Auth screens use local `useState` and `fetch`, not Query.
- Table state uses `useListQueryState` (page, sort, filters in memory, not the URL). Wire a new list the same way.
- `useDebouncedSearch` is for table search. Default delay is 400ms.

## Server vs client

- Add `'use client'` only on components that use state, effects, or browser APIs. Existing client files include dashboard and finance pages, charts, modals, `DataTable`, `DashboardShell`, and `ReactQueryProvider`.
- Root layout, dashboard layout, route handlers, `src/lib/prisma.ts`, and `src/lib/auth.ts` stay on the server.
- Client code talks to route handlers. It does not import `@/lib/prisma` or `@/lib/auth`.

## API

Handlers live in `src/app/api/**/route.ts`. Return JSON. Errors are `{ error: string }` with `400`, `401`, `404`, or `500`. Log the real error with `console.error` and return a generic 500 message.

Browser calls use `apiFetch` from `src/lib/api-client.ts`, except the dashboard helpers and the login, signup, and logout pages, which call `fetch` directly. Match the caller you are editing.

Implemented routes:

- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET` and `POST /api/finance/transactions`, `PATCH` and `DELETE /api/finance/transactions/[id]`
- `GET /api/finance/summary`
- `GET /api/categories`, `GET /api/categories/summary`
- `GET /api/dashboard/metrics`, `GET /api/dashboard/cashflow`, `GET /api/dashboard/balance-trend`

Do not add category, habit, note, or workspace CRUD routes unless asked. Categories are read-only.

Route params in this app are a `Promise` (`const { id } = await params`).

## Database access

- Import the shared client from `@/lib/prisma`. Do not construct another `PrismaClient` in app code.
- The generated client is `@/generated/prisma` and is written to `src/generated/prisma` (gitignored). Run `npx prisma generate` after schema changes. Do not commit the generated folder.
- Schema URL is not inlined. `prisma.config.ts` reads `DATABASE_URL`.
- Seed categories with `npx prisma db seed` (`tsx prisma/seed.ts`). Transaction seed is a separate script: `npx tsx prisma/seed-transactions.ts <email>`.

## Prisma conventions

- Models in use by the app: `User`, `Workspace`, `Category`, `Transaction`.
- Schema-only until a feature is requested: `Habit`, `HabitLog`, `Note`.
- IDs are UUID strings. Money is `Float`. Transaction type is the `TransactionType` enum `CREDIT` | `DEBIT`.
- Scope transaction reads and writes with `workspace: { userId }`. Update and delete must `findFirst` on that scope and return 404 when it misses.
- `onDelete: Cascade` from user and workspace. Category delete sets `Transaction.categoryId` to null.
- `Category.name` and `User.email` are unique. Categories are global rows, not owned by a user or workspace.

## Neon

`src/lib/prisma.ts` uses `PrismaNeon` with `DATABASE_URL` and sets `neonConfig.webSocketConstructor = ws`. Keep that adapter. Do not switch the runtime client to a different driver unless asked.

## Authentication

- Passwords are bcrypt hashes (cost 10). Never select or return `password`.
- Login signs a JWT (`userId`, `email`, 7 days) and sets an HTTP-only cookie named `token` (`sameSite: 'strict'`, `path: '/'`, `secure` when `NODE_ENV === 'production'`).
- Read the session with `getSession` / `requireUserId` in `src/lib/auth.ts`.
- Signup creates a `User` only. It does not set a cookie and does not create a workspace.

## Authorization

- Every protected route handler calls `requireUserId()` and returns 401 when it is null.
- Public writes are signup and login. Logout only clears the cookie.
- `User.role` (`USER` | `ADMIN`) is unused. Do not invent admin checks or bypasses.
- `src/middleware.ts` only checks that the `token` cookie exists. It does not verify the JWT. Page redirects are not authorization. Enforce it again in the handler.

## Workspace isolation

There is no membership table and no workspace switcher. Isolation is per user:

- Take `userId` from the JWT only. Ignore `userId` or `workspaceId` sent by the client.
- On create, use `prisma.workspace.findFirst({ where: { userId } })`. If none exists, create `Personal Workspace` (that is the name the API uses).
- Filter transactions by `workspace: { userId }`.
- Categories are shared. A signed-in user can read the whole catalog. Do not add `userId` to category reads unless the schema changes.
- Habits and notes in the schema are keyed by `userId`, but they have no API. `GET /api/dashboard/metrics` only counts them. The habit streak is the constant `5` when `habit.count > 0`. Do not describe that as a real streak.

## Validation

Use the existing manual checks. Do not add Zod.

- Transactions: `validateTransactionData`. Positive amount, rounded to 2 decimals, type `CREDIT` or `DEBIT`, description trimmed and at most 255 characters, `categoryId` string or null. Handlers also confirm the category exists.
- List query: integer `page` and `limit` (default 20, max 100), `sortBy` in `createdAt | amount | description | type`, `sortDir` `asc | desc`, type `CREDIT | DEBIT`, dates `YYYY-MM-DD` with `dateFrom <= dateTo`.
- Summary and category-summary dates must parse. Summary month bounds must be `lastMonthStart < thisMonthStart < nextMonthStart`.
- Transaction filters use `dateFrom` / `dateTo`. Category summary uses `DateRange` `{ gte?, lt? }`. Do not mix those shapes. `CategoryDonutChart` currently passes `dateFrom` / `dateTo` and does not match `DateRange`.

## Error handling

- Handlers: try/catch, `console.error`, `{ error }` JSON.
- `apiFetch` throws `Error` with the response `error` string.
- UI shows a short inline failure message. Mutations currently `console.error` in the finance page. Match that unless you are changing that screen.

## TypeScript

`strict` is on. Prefer `type` or `interface` next to the feature (`src/features/*/types`, `src/resources/types`). Do not use `any` in new code; some existing files still have it. Do not widen types to silence the donut-chart `DateRange` error.

## TanStack React Query

`ReactQueryProvider` defaults: `staleTime` 5 minutes, `refetchOnWindowFocus: false`.

| Data | Query key |
| --- | --- |
| Current user | `['current-user']` |
| Transaction list | `['transactions', params]` |
| Finance summary | `['transactions', 'summary', range]` |
| Categories | `['categories']` |
| Category summary | `['transactions', 'category-summary', range]` |
| Dashboard counts | `['dashboard-metrics']` |
| Cash flow | `['dashboard-metrics', 'cashflow', months]` |
| Balance trend | `['dashboard-metrics', 'balance-trend', days]` |

Create, update, and delete transactions invalidate `['transactions']` and `['dashboard-metrics']`. Keep summary and chart keys on those prefixes so they refresh. List and chart queries use `placeholderData: keepPreviousData`.

## Styling

Tailwind CSS 4 is loaded with `@import "tailwindcss"` in `src/app/globals.css`. Style with utility classes in `className`. Use `cn` from `src/lib/cn.ts` when merging classes. Fonts are Inter, DM Sans, and Bricolage Grotesque via `next/font`. The active font variable defaults to DM Sans. `html[data-font]` exists and nothing sets it. Do not add a CSS-in-JS library.

## Testing

No test runner and no tests exist. `package.json` has no `test` script. Do not add a framework or a `test` script unless asked. Do not claim tests passed.

## Git and pull requests

Remote default branch is `main`. Do not commit unless asked. Do not commit `.env` or `src/generated/prisma`. Do not force-push `main`.

Before a PR, run `npm run lint`, `npm run typecheck`, and `npm run build`.

## CI/CD

`github/workflows/ci.yml` is not loaded by GitHub Actions. Actions reads `.github/workflows/`. The file also runs `npm run test`, which is not defined. Do not claim CI is green. Do not move that file unless asked.

`npm run build` runs `next build`, which type-checks. It fails while `CategoryDonutChart` assigns `dateFrom` / `dateTo` on `DateRange`.

No Vercel config, Dockerfile, or deploy script is committed. Production needs `DATABASE_URL` and `JWT_SECRET`.

## Environment variables

Server-only, required: `DATABASE_URL`, `JWT_SECRET`. Optional, seed script only: `SEED_USER_EMAIL`. `NODE_ENV` is set by the runtime.

There is no `.env.example` and no `NEXT_PUBLIC_` variable. Do not put secrets in client code, logs, or commits. Do not print real connection strings or tokens.

`prisma.config.ts` and the seed scripts import `dotenv/config`. `dotenv` is not a direct dependency. It arrives through Prisma. Do not add it unless a seed fails to resolve the module and the user asks.

## Security

- Keep the session cookie HTTP-only. Do not move the JWT to `localStorage`.
- Do not trust workspace or user ids from the browser.
- Do not return password hashes.
- Do not weaken `requireUserId` because middleware already redirected.
- Validate sort fields and dates before they reach Prisma.
- Category ids on write must exist. Reads of transactions still must be ownership-scoped.

## Financial data

- `CREDIT` is income. `DEBIT` is expense. Net is income minus expense.
- Round amounts to 2 decimals the way `validateTransactionData` and the summary helpers do.
- Month boundaries for `/api/finance/summary` come from the browser (`useFinanceSummary`) so the range follows the user timezone. Preserve that.
- Cash-flow `months=all` caps at 60 months. Balance `days=all` caps at 730 days. Opening balance includes transactions before the window.
- Do not calculate ledger totals only in the client. The summary and chart routes aggregate in Prisma.
- Amounts are `Float` in the schema. Do not migrate them to `Decimal` unless asked.

## AI coding behavior

- Read the feature you are changing before editing. Copy its hook, fetch helper, and route pattern.
- Do not create folders that are not listed above.
- Do not install packages or edit `package.json` unless asked.
- Do not expand a placeholder page into a new product area unless asked.
- Preserve this Next.js agent block. Do not edit the text between `BEGIN:nextjs-agent-rules` and `END:nextjs-agent-rules`.
- If a comment and the code disagree, follow the code. Signup does not create a workspace. The category-summary comment that mentions `/api/finance/categories/summary` is wrong; the route is `/api/categories/summary`.
- Leave unrelated files alone. Match quote and semicolon style of the file you edit.
