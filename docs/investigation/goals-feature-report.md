# Financial Goals Feature Investigation

## 1. Executive summary (10 lines max) and a feasibility/risk verdict

- This is a Next.js 16.3.4 App Router application using TypeScript, Prisma 7.10, PostgreSQL on Neon, TanStack Query 5, Tailwind CSS 4, DaisyUI 5, and `pnpm`.
- Goals are NOT FOUND as a feature, Prisma model, API, dashboard route, or dashboard navigation item. `primaryGoal` is an onboarding/profile preference, not a savings goal.
- Budgets are the closest financial-object reference: feature-local API/hooks/types/components plus direct-Prisma Next route handlers.
- Workspace selection is client-side, persisted in local storage, and sent as `X-Workspace-Id`; every Goals API route must validate membership and role on the server.
- Reuse `budgetAccess`'s access pattern, shared UI controls, `formatINR`, `notify`, active-workspace hook, and TanStack Query invalidation conventions.
- Recommend a `Goal` model plus an append-only contribution ledger so add/remove actions remain auditable and balances can be updated atomically.
- Feasibility: high. Main risks are money precision inherited from Float, permission-matrix updates, and date-only interpretation/month-count policy.
- Verification is `pnpm exec prisma validate`, `pnpm exec prisma generate`, `pnpm typecheck`, `pnpm lint`; no test runner or test suite currently exists.

## 2. Current-state findings (stack, structure, conventions, data, workspace, API, UI) with file-path evidence

### Stack and conventions

| Concern             | Current implementation and evidence                                                                                                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework/router    | Next.js `16.3.4`, App Router under `src/app`; route handlers use `src/app/api/**/route.ts`. `package.json`; `src/app/dashboard/layout.tsx`.                                                                                                          |
| Language            | TypeScript `^5`, strict enabled, JSX `react-jsx`; alias `@/*` maps to `src/*`. `package.json`; `tsconfig.json`.                                                                                                                                      |
| Package manager     | `pnpm-lock.yaml`, `pnpm-workspace.yaml`; npm-style scripts in `package.json`. Use `pnpm` in this repo.                                                                                                                                               |
| ORM/database        | Prisma `^7.10.0`, PostgreSQL, Neon adapter. Schema in `prisma/schema.prisma`, configuration in `prisma.config.ts`, shared client in `src/lib/db/prisma.ts`.                                                                                          |
| Authentication      | Custom JWT/session helpers; protected workspace APIs call `requireWorkspaceAccess` or `requireWorkspaceAction` from `src/lib/auth/workspaces.ts`.                                                                                                    |
| UI                  | React `19.2.8`, Lucide React `^1.45.0`, local controls in `src/components/ui`, DaisyUI 5.7.47. No general component library dependency beyond these existing UI packages.                                                                            |
| Styling             | Tailwind CSS 4, DaisyUI theme tokens, utility classes. `src/app/globals.css`; `postcss.config.mjs`.                                                                                                                                                  |
| Forms/validation    | No form library or schema validator dependency. Components use controlled React state and feature-local manual validation, e.g. `src/features/budgets/components/BudgetFormModal.tsx`, `src/lib/budgets/budgets.ts`. Do not add Zod/React Hook Form. |
| Data fetching/state | TanStack Query `^5.102.8`; `apiFetch`/`withWorkspace` in `src/lib/api-client.ts`; workspace state in `src/features/workspaces/WorkspaceProvider.tsx`.                                                                                                |
| Testing             | No test files or test script found. `package.json`, `README.md` testing section. `tsx` and Node types exist, but no Jest/Vitest/Testing Library.                                                                                                     |
| Lint/format         | ESLint 9 using Next core-web-vitals/TypeScript config in `eslint.config.mjs`. Prettier 3 and Tailwind plugin are installed; scripts include `format:check`. No separate Prettier config was found in the checked root files.                         |

### Three-level structure

```text
prisma/                         schema, migration history, seed scripts (no seed files were found)
  migrations/                   ordered PostgreSQL migrations
src/
  app/                          App Router pages, layouts, API route handlers
    api/                        REST handlers grouped by feature
    dashboard/                  signed-in dashboard screens
  components/                   shared layout, providers, and UI primitives
    layout/                     dashboard shell and mobile navigation
    ui/                          buttons, inputs, modal, table, charts, confirmation
  features/                     feature-owned components, APIs, hooks, types, logic
    budgets/                     budget screen feature reference
    finance/                     transactions and finance workflows
    workspaces/                  workspace client context and permission map
  hooks/                         cross-feature browser hooks
  lib/                           shared API, auth, DB, validation, finance utilities
  resources/                     shared/global category data and controls
public/                          static public assets and CSV samples
```

The tree is evidenced by the workspace listing and paths such as `src/features/budgets/{api,components,hooks,types}`, `src/app/api/budgets`, and `src/components/ui`. New feature files should use kebab-case for feature modules/hooks/API helpers, PascalCase for React components, and `index.ts` for feature-local types where that folder already uses an index barrel.

### Naming, routing, types, and format rules

- Prisma models use singular PascalCase (`Budget`, `Transaction`, `FinancialAccount`); properties use camelCase (`workspaceId`, `targetDate`); database identifiers are quoted camelCase unless `@@map` is used. Evidence: `prisma/schema.prisma` models `Budget`, `Transaction`, `FinancialAccount`.
- REST endpoints use plural nouns (`/api/budgets`, `/api/finance/transactions`), item routes use `[id]`, route params are promises in Next 16. Evidence: `src/app/api/budgets/route.ts`, `src/app/api/budgets/[id]/route.ts`.
- Feature files use kebab-case (`budgets-api.ts`, `use-budgets.ts`), component files use PascalCase (`BudgetFormModal.tsx`). Existing mixed styles exist in other areas; follow the owning feature's observed pattern.
- `tsconfig.json` sets `strict: true`, `moduleResolution: bundler`, and `@/*` to `./src/*`. `eslint.config.mjs` composes Next presets and excludes generated Prisma output.
- Formatting is not globally uniform: existing routes/components mix indentation patterns and the repo guidance acknowledges quote/semicolon variance. Match the nearby file's quote and indentation convention; Prettier uses Tailwind class sorting when invoked.

### Data and money/date behavior

- Workspace-scoped records carry `workspaceId`, foreign-key relation to `Workspace`, `createdAt @default(now())`, `updatedAt @updatedAt`, and workspace indexes. `Budget` uses `String @id @default(cuid())`; most newer domain models use UUID strings. Follow nearby financial models with UUIDs for consistency unless an existing Goals-specific requirement decides otherwise. `prisma/schema.prisma` (`Workspace`, `Budget`, `FinancialAccount`, `Transaction`).
- Money is currently `Float` in `Budget`, `FinancialAccount.openingBalance`, and `Transaction.amount`. No integer-paise convention was found. Existing amount validators round to two decimal places, e.g. `validateAmount` in `src/lib/budgets/budgets.ts` and `validateTransactionData` in `src/features/finance/lib/validate-transaction.ts`.
- Workspace has `currency String @default("INR")`; FinancialAccount also carries currency. Shared `formatINR` in `src/features/budgets/utils.ts` uses `Intl.NumberFormat(locale, { style: 'currency', currency: 'INR' })`, default `en-IN`; it formats Indian grouping (₹1,00,000). Workspace currency is not currently used by this helper. Goals should match current INR display but be explicit that multi-currency goal totals are not supported by this proposal.
- Transaction/schedule calendar dates use 12:00 UTC and `toScheduleDate` in `src/lib/recurring/recurring-dates.ts`; recurring and template views format dates with locale-aware `Intl`/`toLocaleDateString`. `Budget` uses timestamps for period boundaries. For Goals, use the existing 12:00 UTC calendar-date helper to avoid local timezone day drift and format target dates with `{ month: 'short', year: 'numeric', timeZone: 'UTC' }` to show `Dec 2026`.
- No date-fns/dayjs dependency was found. Use built-in `Date`/`Intl` and `toScheduleDate`.

### Workspace and authorization

- `Workspace` has an owner, `WorkspaceAccess[]`, active flag, and workspace-owned finance collections. Membership is a unique `(workspaceId,userId)` row with `WorkspaceRole`. `prisma/schema.prisma` (`Workspace`, `WorkspaceAccess`).
- `WorkspaceProvider` loads workspaces, uses local-storage key `active-workspace-id`, selects a still-accessible workspace or falls back to the first, and exposes `useActiveWorkspaceId`. `src/features/workspaces/WorkspaceProvider.tsx`.
- `withWorkspace` sends `X-Workspace-Id`; this value is only a requested workspace. `requireWorkspaceAccess` reads the authenticated user from the server session, checks membership, active workspace, and role, and returns `workspaceId` only after authorization. `src/lib/api-client.ts` (`withWorkspace`); `src/lib/auth/workspaces.ts` (`WORKSPACE_HEADER`, `requireWorkspaceAccess`, `requireWorkspaceAction`).
- Budget reads call `budgetAccess(request, false)`; writes call `budgetAccess(request, true)`, which requires the named `budgets.manage` action. Every budget query/write filters by `access.workspaceId`. `src/lib/budgets/budget-access.ts`; `src/app/api/budgets/route.ts`; `src/app/api/budgets/[id]/route.ts`.
- Existing permissions live in `src/features/workspaces/permissions.ts`; `goals.manage` is NOT FOUND. Add it deliberately. Recommended default: all workspace roles can read; OWNER/ADMIN can create, edit, contribute, archive, matching `budgets.manage`. If product intends MEMBER write access, make that a specific permission-matrix decision rather than using a rank check.

### Goals search result

The case-insensitive targeted search for `goal|goals|saving|target|milestone` found onboarding `primaryGoal` and marketing copy, but no Goals feature/model/API/dashboard page/navigation. Searched `prisma/schema.prisma`, `prisma/migrations`, `src/app`, `src/features`, `src/components`, and `src/lib`; see Appendix. Marketing `Target` icons/copy and onboarding `GOAL_OPTIONS` do not constitute the requested savings feature. `prisma/schema.prisma` (`User.primaryGoal`); `src/features/onboarding/types.ts`; `src/components/layout/DashboardShell.tsx` (`navigation`, `mobileTabs`, `mobileMoreItems`).

## 3. Reference feature trace (the closest existing feature, end to end)

**Budgets** is the closest end-to-end feature because it is a workspace-scoped financial object with amount, active status, a management permission, CRUD-like mutations, progress calculations, and a dashboard page.

1. **Database:** `Budget` stores `id`, `workspaceId`, `categoryId`, `amount Float`, period/date fields, `isActive`, timestamps, a workspace relation, unique `(workspaceId,categoryId,period)`, and `(workspaceId,isActive)` index. `prisma/schema.prisma` (`Budget`, `BudgetPeriod`).
2. **Access/validation/calculation:** `budgetAccess` uses `requireWorkspaceAccess` for reads and `requireWorkspaceAction(...,'budgets.manage')` for writes. `src/lib/budgets/budget-access.ts`. `validateAmount`, `parsePeriod`, `parseStartDate`, `buildUsage`, and `getBudgetUsage` live in `src/lib/budgets/budgets.ts`.
3. **List/create API:** `GET /api/budgets` validates an optional one-month date range, queries `getBudgetUsage`, and returns `{ period, budgets, totals }`. `POST /api/budgets` validates category and amount, checks category workspace/type/active rules, handles duplicate/unique conflict as 409, enforces plan limit, creates/reactivates a budget, and returns `{ budget }` with 201 or 200. `src/app/api/budgets/route.ts` (`GET`, `POST`).
4. **Update/archive API:** `PATCH /api/budgets/[id]` validates amount and performs a workspace-scoped `findFirst` before updating; missing/cross-workspace IDs return 404. `DELETE` sets `isActive=false` rather than hard-deleting. `src/app/api/budgets/[id]/route.ts` (`PATCH`, `DELETE`).
5. **Fetch/hooks:** `budgetsApi` wraps `apiFetch` and `withWorkspace`; query keys include workspace ID; mutations invalidate budget keys, reports, and optionally plan data. `src/features/budgets/api/budgets-api.ts`; `src/features/budgets/hooks/use-budgets.ts` (`budgetKeys`, `useBudgetUsage`, `useCreateBudget`, `useUpdateBudget`, `useDeactivateBudget`).
6. **Screen:** `BudgetsPage` owns month selection, permission/plan gating, loading/fetch/error flags, empty state, form/edit state, and removal confirmation. It uses `notify.success/error`; failures remain inline or toast depending on operation. `src/app/dashboard/budgets/page.tsx` (`BudgetsPage`).
7. **Components/UI:** `BudgetTable` uses shared `DataTable`, Lucide icons, inline progress bar, status badge, `formatINR`, and preference-driven locale/page size/density. `BudgetFormModal` uses shared `Modal`, `Button`, `Input`, `CategorySelect`, mutation hooks, controlled state, inline validation errors, and `notify`. Deactivation uses shared `ConfirmDialog`. `src/features/budgets/components/BudgetTable.tsx`; `src/features/budgets/components/BudgetFormModal.tsx`; `src/components/ui/ConfirmDialog.tsx`.
8. **States:** screen error is an inline themed error box; empty state is dashed-border and has a create action; `DataTable` accepts `isLoading`/`isFetching`. Budget page has no separately exported skeleton/empty-state component. `src/app/dashboard/budgets/page.tsx`; `src/components/ui/DataTable.tsx`.
9. **Audit:** budget writes append audit records via `logAudit`. Goals should either add explicit Goals audit actions or rely on contribution history plus an explicit decision to omit activity audit. `src/app/api/budgets/route.ts`; `src/app/api/budgets/[id]/route.ts`.
10. **Tests:** NOT FOUND. There is no existing budget test to copy and no configured test runner.

Transactions are a useful secondary reference for endpoint safety and CRUD: `src/app/api/finance/transactions/route.ts` (`GET`, `POST`) validates query inputs and returns paginated `{ data, pagination, appliedFilters, appliedSort }`; `src/app/api/finance/transactions/[id]/route.ts` (`PATCH`, `DELETE`) always scopes lookup by `workspaceId` before mutation. Transaction amount/date validation is in `src/features/finance/lib/validate-transaction.ts`.

## 4. Files to UPDATE — table: path | exact change | why | risk

| path                                       | exact change                                                                                                                                                                                 | why                                                                    | risk                                                                                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `prisma/schema.prisma`                     | Add `GoalStatus`, `GoalContributionKind`, `Goal`, `GoalContribution`; add `goals Goal[]` to `Workspace`. Full additions are in section 5.                                                    | Required workspace-scoped persistence and contribution audit trail.    | Float precision; relation names must match migration.                                                                                                  |
| `src/features/workspaces/permissions.ts`   | Add `'goals.manage'` to `WorkspaceAction`, `ACTION_LABELS`, and OWNER/ADMIN permission assignments.                                                                                          | Server guard and `usePermission` share this matrix.                    | Incorrect role assignment could grant/deny writes.                                                                                                     |
| `src/components/layout/DashboardShell.tsx` | Add `Target` import from `lucide-react`; add Goals to desktop `navigation` and `mobileMoreItems` or `mobileTabs`. Recommended desktop plus mobile More to preserve limited bottom-tab width. | This is the active dashboard nav source.                               | Desktop `isActive` currently uses exact pathname equality; exact `/dashboard/goals` works, nested routes would not. Mobile uses prefix-aware matching. |
| `package.json`                             | No change recommended for initial feature; use built-in `node:test` and already installed `tsx` for pure calculation tests.                                                                  | Avoid adding a test framework contrary to existing dependency/tooling. | Route/component automated coverage remains limited until a test library is explicitly adopted.                                                         |
| `README.md`                                | Update the current feature list and testing notes after implementation.                                                                                                                      | Current feature list has no goals.                                     | Documentation drift if omitted.                                                                                                                        |

## 5. Files to CREATE — for each: path, purpose, and the FULL proposed content (code), written to match existing conventions exactly. Include: schema/model + migration, validation schemas, types, calculation utilities, service/API/actions, page at /dashboard/goals, goal card, goal form (create/edit), add/remove money dialog, archive/delete confirmation, empty/loading states, nav entry, tests

These are implementation proposals, not existing files. They follow current feature-local organization and manual validation. API handlers call Prisma directly; no service/repository layer is introduced. `DashboardShell` navigation is an **update** listed in section 4, not a new file. The examples below are complete proposed file contents for the new feature files; schema/permission/nav additions are explicitly marked as snippets to merge into existing files.

### Schema additions (`prisma/schema.prisma`)

Add the following enum/models; add `goals Goal[]` to `Workspace` alongside its other workspace relations:

```prisma
enum GoalStatus {
  ACTIVE
  ARCHIVED
}

enum GoalContributionKind {
  ADD
  REMOVE
}

model Goal {
  id            String                 @id @default(uuid())
  workspaceId   String
  workspace     Workspace              @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name          String
  targetAmount  Float
  currentAmount Float                  @default(0)
  targetDate    DateTime
  description   String?
  status        GoalStatus              @default(ACTIVE)
  contributions GoalContribution[]
  createdAt     DateTime                @default(now())
  updatedAt     DateTime                @updatedAt

  @@index([workspaceId, status, targetDate])
  @@index([workspaceId, createdAt])
}

model GoalContribution {
  id        String                 @id @default(uuid())
  goalId    String
  goal      Goal                   @relation(fields: [goalId], references: [id], onDelete: Cascade)
  kind      GoalContributionKind
  amount    Float
  createdAt DateTime               @default(now())

  @@index([goalId, createdAt])
}
```

`COMPLETED` and `OVERDUE` are deliberately derived response/UI states, not persisted `GoalStatus` values. This avoids stale completion state when contributions are removed and avoids making overdue depend on a scheduled midnight job. `ARCHIVED` is persisted. There is no `plannedMonthlyContribution` field: monthly contribution is computed from target/current/date.

### Migration (`prisma/migrations/20261007000000_add_goals/migration.sql`)

```sql
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "GoalContributionKind" AS ENUM ('ADD', 'REMOVE');

CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoalContribution" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "kind" "GoalContributionKind" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoalContribution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Goal_workspaceId_status_targetDate_idx"
    ON "Goal"("workspaceId", "status", "targetDate");
CREATE INDEX "Goal_workspaceId_createdAt_idx"
    ON "Goal"("workspaceId", "createdAt");
CREATE INDEX "GoalContribution_goalId_createdAt_idx"
    ON "GoalContribution"("goalId", "createdAt");

ALTER TABLE "Goal"
    ADD CONSTRAINT "Goal_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoalContribution"
    ADD CONSTRAINT "GoalContribution_goalId_fkey"
    FOREIGN KEY ("goalId") REFERENCES "Goal"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
```

### Goal form (`src/features/goals/components/GoalFormModal.tsx`)

```tsx

```

### Add/remove money dialog (`src/features/goals/components/GoalContributionModal.tsx`)

```tsx

```

### Archive confirmation (`src/features/goals/components/GoalArchiveDialog.tsx`)

```tsx

```

### Empty/loading states (`src/features/goals/components/GoalStates.tsx`)

```tsx

```

### Goals dashboard screen (`src/features/goals/components/GoalsDashboard.tsx`)

```tsx

```

### App route (`src/app/dashboard/goals/page.tsx`)

```tsx

```

### Pure calculation tests (`src/features/goals/lib/goals.test.ts`)

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { getGoalProgress, getGoalStatus, getRequiredMonthlyContribution } from './goals';

test('progress clamps the displayed percentage and remaining amount', () => {
    assert.deepEqual(getGoalProgress(45_000, 100_000), {
        percentageCompleted: 45,
        remainingAmount: 55_000,
    });
    assert.deepEqual(getGoalProgress(120, 100), { percentageCompleted: 100, remainingAmount: 0 });
    assert.deepEqual(getGoalProgress(5, 0), { percentageCompleted: 0, remainingAmount: 0 });
});

test('monthly contribution counts the current month and rounds up to paise', () => {
    assert.equal(
        getRequiredMonthlyContribution(0, 10_000, '2026-10-31', new Date(2026, 9, 7)),
        10_000,
    );
    assert.equal(
        getRequiredMonthlyContribution(0, 10_000, '2026-11-30', new Date(2026, 9, 7)),
        5_000,
    );
    assert.equal(getRequiredMonthlyContribution(0, 10, '2026-11-30', new Date(2026, 9, 7)), 5);
});

test('past targets return null monthly contribution and overdue status', () => {
    const today = new Date(2026, 9, 7);
    assert.equal(getRequiredMonthlyContribution(0, 10_000, '2026-10-06', today), null);
    assert.equal(getGoalStatus('ACTIVE', 0, 10_000, '2026-10-06', today), 'OVERDUE');
});

test('completion takes precedence over overdue and archive takes precedence over completion', () => {
    const today = new Date(2026, 9, 7);
    assert.equal(getGoalStatus('ACTIVE', 10_000, 10_000, '2026-10-01', today), 'COMPLETED');
    assert.equal(getGoalStatus('ARCHIVED', 10_000, 10_000, '2026-10-01', today), 'ARCHIVED');
    assert.equal(getRequiredMonthlyContribution(10_000, 10_000, '2026-10-01', today), 0);
});
```

Run the pure tests with `node --import tsx --test src/features/goals/lib/goals.test.ts` on a Node version supporting `--import`. API and component tests are recommended once a test/mocking/rendering stack is approved; adding them now would require packages absent from `package.json`. A fake assertion test without real route isolation would misrepresent coverage.

### Existing-file snippets required for wiring

Add in `src/features/workspaces/permissions.ts`:

```ts
// Add to WorkspaceAction:
| 'goals.manage'

// Add to ACTION_LABELS:
'goals.manage': 'Create, edit, contribute to and archive savings goals',

// Add to ROLE_PERMISSIONS.MEMBER only if members should manage goals.
// Recommended initial behavior mirrors budgets.manage: OWNER and ADMIN inherit ALL;
// MEMBER does not receive goals.manage; VIEWER remains read-only.
```

For the recommended roles, `goals.manage` is already covered by `ALL` for OWNER and ADMIN; `ACTION_LABELS` drives `ALL`. Do not add this action to the MEMBER list unless the product changes the permission policy.

Add `Target` to the Lucide imports in `src/components/layout/DashboardShell.tsx`, then insert `{ name: 'Goals', href: '/dashboard/goals', icon: Target }` into `navigation`. To surface on mobile, add it to `mobileMoreItems` (the four persistent bottom tabs are intentionally limited). Desktop uses `pathname === item.href`; mobile uses exact-or-prefix matching in `MobileTabBar`.

## 6. Reuse map — table: existing asset | path | how Goals uses it

| existing asset                    | path                                                                                                                                            | how Goals uses it                                                                                                                                                         |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace selection/context       | `src/features/workspaces/WorkspaceProvider.tsx` (`useActiveWorkspaceId`)                                                                        | Build workspace-specific query keys and attach selected ID to API requests.                                                                                               |
| Workspace API guard               | `src/lib/auth/workspaces.ts` (`requireWorkspaceAccess`, `requireWorkspaceAction`)                                                               | Guard every read/write; derive workspace ID only from authorized header+membership, never trust body input.                                                               |
| Workspace role hook/matrix        | `src/features/workspaces/hooks/use-permission.ts`; `src/features/workspaces/permissions.ts`                                                     | Show mutation controls only when `goals.manage`; add permission label/action. Server enforcement remains mandatory.                                                       |
| Request helper                    | `src/lib/api-client.ts` (`apiFetch`, `withWorkspace`)                                                                                           | Client fetch helper and workspace header.                                                                                                                                 |
| Shared Prisma client              | `src/lib/db/prisma.ts`                                                                                                                          | Reuse in route handlers. Never import from client components.                                                                                                             |
| React Query pattern               | `src/features/budgets/hooks/use-budgets.ts`                                                                                                     | Feature-local keys, mutations, query invalidation, `keepPreviousData`.                                                                                                    |
| INR formatter                     | `src/features/budgets/utils.ts` (`formatINR`)                                                                                                   | Display current/target/remaining/monthly values with locale.                                                                                                              |
| Date normalization                | `src/lib/recurring/recurring-dates.ts` (`toScheduleDate`)                                                                                       | Validate/store target calendar date using existing 12:00 UTC convention.                                                                                                  |
| Button/Input/Modal                | `src/components/ui/Button.tsx`; `src/components/ui/Input.tsx`; `src/components/ui/Modal.tsx`                                                    | Use existing controls in forms/dialogs; no new component library.                                                                                                         |
| Confirmation                      | `src/components/ui/ConfirmDialog.tsx`                                                                                                           | Confirm archive before changing persisted status.                                                                                                                         |
| Toast                             | `src/lib/ui/toast.ts` (`notify`)                                                                                                                | Success/error feedback for mutations.                                                                                                                                     |
| Progress visual                   | Native `<progress>` in `src/features/reports/components/BudgetPerformance.tsx`; inline bar in `src/features/budgets/components/BudgetTable.tsx` | Use native `<progress>` with themed `progress-primary`, `max=100`, value clamped to 100, and accessible `aria-label`. No dedicated reusable Progress component was found. |
| Loading and empty conventions     | `src/app/dashboard/budgets/page.tsx`; `src/components/ui/DataTable.tsx`                                                                         | Theme-token skeleton/empty/error patterns. Proposed goals card grid uses a small local state component.                                                                   |
| Dashboard nav/mobile active logic | `src/components/layout/DashboardShell.tsx`; `src/components/layout/MobileTabBar.tsx`                                                            | Add destination to `navigation` and `mobileMoreItems`; mobile uses prefix-aware active links.                                                                             |
| Theme tokens                      | `src/app/globals.css`                                                                                                                           | Use `base-*`, `primary`, `success`, `warning`, `error` utility tokens, so theme/dark-mode switch remains effective.                                                       |

## 7. Wiring diagram — step-by-step data flow (DB → service/API → validation → fetch → page → card → mutation → refresh) plus a text/mermaid diagram

1. `Goal` and `GoalContribution` plus a `Workspace` relation are migrated through Prisma; generated types are regenerated.
2. A page is reached at `/dashboard/goals`; `dashboard/layout.tsx` has already enforced signed-in/onboarding state and wrapped the dashboard in `WorkspaceProvider` and `DashboardShell`.
3. `GoalsDashboard` reads `useActiveWorkspaceId`, `usePermission('goals.manage')`, and `useGoals`; its query key includes workspace ID.
4. `goalsApi` calls `/api/goals` via `apiFetch` and `withWorkspace`, setting `X-Workspace-Id`.
5. Route handler calls `requireWorkspaceAccess(...,'VIEWER')`; helper authenticates the session and verifies membership/active workspace. Mutations call `requireWorkspaceAction(...,'goals.manage')`.
6. Route handler validates values using `validate-goal.ts`, writes directly through shared Prisma client scoped by the authorized `workspaceId`, then maps records through `toGoalView`.
7. Page renders loading/error/empty states or a responsive grid of `GoalCard` cards.
8. Add/remove operation uses a conditional atomic update and appends `GoalContribution` in the same DB transaction; archive updates status, not deletes the record.
9. Mutation hook invalidates `['goals', workspaceId]`; screen refetches for the same workspace and cards show updated progress.

```mermaid
flowchart LR
  DB[(PostgreSQL / Prisma Goal + Contribution)] --> R[Next route handler]
  R --> A[Workspace auth and role guard]
  R --> V[Manual input validation]
  V --> DB
  R --> F[goalsApi via apiFetch + X-Workspace-Id]
  F --> Q[TanStack Query hooks]
  Q --> P[/dashboard/goals page]
  P --> C[GoalCard / form / contribution / archive dialog]
  C --> M[Mutation hook]
  M --> R
  M --> I[Invalidate goals workspace query]
  I --> Q
```

## 8. Consistency checklist — folder/file naming, design tokens, spacing, ₹ formatting, date format, error/toast patterns, dark mode, responsiveness, accessibility

- [ ] Feature tree uses `src/features/goals/{api,components,hooks,lib,types}`; app screen wrapper at `src/app/dashboard/goals/page.tsx`; APIs under `src/app/api/goals`.
- [ ] Kebab-case modules/hooks/routes; PascalCase components; no invented service/repository layer.
- [ ] `@/` aliases and existing `Button`, `Input`, `Modal`, `ConfirmDialog` used; no new dependencies.
- [ ] Every route uses `requireWorkspaceAccess` for reads / `requireWorkspaceAction` for writes and scopes each query with authorized `workspaceId`.
- [ ] Page uses `usePermission`; never rely on hidden buttons as authorization.
- [ ] Use existing theme classes (`bg-base-100`, `border-base-300`, `text-base-content`, `text-base-content/60`, `progress-primary`, semantic status colors); no hard-coded light-only palette.
- [ ] Follow nearby spacing (`space-y-4/6`, `gap-4`, `p-5`) and rounded corners (`rounded-lg/xl`, current DaisyUI tokens).
- [ ] Format money through `formatINR(amount, locale)`; locale via `useUserLocale`; do not hand-build Indian commas or concatenate rupee symbol with unformatted values.
- [ ] Date input remains `YYYY-MM-DD`; server uses `toScheduleDate`; output is short month/year in UTC for the stored calendar date.
- [ ] API errors return `{ error }` and appropriate 400/401/403/404/500; route exceptions log generic operation context via `console.error`; UI shows inline load/form errors and `notify` on mutation success/failure.
- [ ] Loading/empty/error states are mutually exclusive; show empty only after load completes and without error.
- [ ] Mobile grid uses one column by default, two at `sm`, three at wide widths; text uses `min-w-0`, truncation/wrapping, and progress remains full width.
- [ ] Native `<progress>` has `max=100` and descriptive `aria-label`; action icon buttons have `aria-label`; field labels bind with `htmlFor`; errors use `role="alert"`.
- [ ] Confirm archive explicitly says data/history remains; do not call an archive a permanent delete.
- [ ] Confirm dark theme by using only tokens defined by DaisyUI/Tailwind theme and avoid fixed background/text colors.

## 9. Business rules spec — the formulas and edge-case table from Step 6

### Calculations

- `remaining = max(targetAmount - currentAmount, 0)`.
- `percentage = targetAmount > 0 ? clamp(currentAmount / targetAmount * 100, 0, 100) : 0`. In normal valid data target is positive; zero-target fallback protects legacy/corrupt data.
- Monthly contribution is a **computed required contribution**, not a planned/user-entered amount. Let `R` be remaining and `M` be count of calendar months including the current month through the target month: `ceil((targetYear-currentYear)*12 + (targetMonth-currentMonth) + 1)`. Then `ceil((R/M)*100)/100` to round upward to a cent. Target date earlier than today yields `null` (display “Target date passed”); zero remaining yields `0` regardless of date.
- Counting current month as one contribution period answers “how much to add this month and each remaining month?” A target date later this month is one period. A date earlier than today is past even if it lies in the current calendar month. The report implementation uses browser-local calendar date for comparison; date storage is normalized to 12:00 UTC.
- The example `Monthly contribution: ₹5,000` should mean required/computed contribution. If users later need a commitment independent from the computed requirement, add a separate `plannedMonthlyContribution` field and label it “Planned contribution”; do not overload the calculated value.

### Mutations, status, deletion, and ledger

- Create: trimmed non-empty name (max 100), target > 0, amount <= ₹1,000,000,000 (matching budget guardrail), valid calendar date, optional description <= 1,000; initialize current to zero/status ACTIVE.
- Edit: update name/target/date/description; current balance is changed only through add/remove contribution. If target is reduced below current, goal becomes completed by derivation. Archived goals are not editable.
- Add money: amount must be finite, > 0, rounded to 2 decimals. Allow current balance to exceed target because actual savings can exceed an estimate; display percent capped at 100 and remaining at zero.
- Remove money: finite amount > 0, rounded to 2 decimals; reject atomically when amount > current balance. Result cannot be negative. Removing below target makes a non-archived goal active/overdue again.
- Atomicity: one DB transaction inserts a contribution row and performs workspace-scoped conditional `updateMany` (`currentAmount >= amount` for removal). A changed-row count other than one fails without a contribution record. All goal reads/mutations check the authorized workspace.
- Stored states: `ACTIVE` or `ARCHIVED`. `COMPLETED` is derived when current >= target; `OVERDUE` is derived when active, incomplete, and target calendar date < today. Completion takes precedence over overdue; archived takes precedence over both and is not auto-unarchived by contributions (contributions on archived goal are rejected).
- Archive: normal destructive-looking UI action is soft archive; default list omits archived goals; `?includeArchived=true` is available for future archive tab/history. Archived rows and contribution history remain.
- Hard delete: not exposed in proposed UI/API. This is intentional because deleting destroys progress history. If permanent deletion is a product requirement, add a separately worded irreversible action and confirm that cascading contribution deletion is acceptable.
- Contribution ledger recommendation: separate append-only `GoalContribution` is preferred over a single mutable balance. Benefits: history/audit, explainable balance changes, future charts/undo. Cost: extra table and atomic write. `currentAmount` remains a transactional cache/materialized balance for card queries; ledger consistency must be maintained in one DB transaction. A later reconciliation can sum ADD minus REMOVE. Existing transactions are ledger-like but do not represent goal allocations; do not silently create financial transactions for goal contributions unless the product says money leaves an account.

### Edge cases

| Case                                          | Required result                                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| target amount zero/invalid input              | Reject create/edit; calculation helper still returns 0 percent and non-negative remaining for defensive safety.            |
| current >= target                             | 100%; remaining 0; status COMPLETED; monthly contribution 0.                                                               |
| current > target                              | Keep actual current amount; display capped 100%, remaining 0; status COMPLETED.                                            |
| incomplete, date earlier than today           | Status OVERDUE; monthly contribution null; label target date passed.                                                       |
| incomplete, target later within current month | One monthly period; monthly contribution equals remaining (rounded upward to cents).                                       |
| incomplete, target in future month            | Include current month and target month in count.                                                                           |
| add/remove request races                      | Conditional atomic update and contribution insert in same transaction; one invalid removal does not create a ledger event. |
| remove more than current balance              | Return 400; no update/contribution row.                                                                                    |
| unknown ID or another workspace's ID          | 404 after workspace-scoped lookup; never leak record.                                                                      |
| archived goal                                 | Hidden by default, readable only when includeArchived is requested, immutable to contributions/edit.                       |
| archived goal reaches target                  | Remains ARCHIVED, not displayed as completed.                                                                              |
| locale / India format                         | `formatINR(value, locale)`; default `en-IN` gives Indian digit grouping.                                                   |

## 10. Implementation order — numbered, with dependencies and verification command after each step

1. **Agree business policy and permission role.** Confirm archive-only versus permanent deletion, whether MEMBER may mutate, and whether contribution records represent tracking only or actual account transfers. Verify references: inspect `src/features/workspaces/permissions.ts`, `src/lib/auth/workspaces.ts`.
2. **Add schema and migration.** Update `prisma/schema.prisma`, create the SQL migration above. Verify: `pnpm exec prisma validate`; review generated migration SQL; do not run production migration from the investigation task.
3. **Regenerate Prisma client.** Verify: `pnpm exec prisma generate`; generated output under `src/generated/prisma` is ignored and must not be committed.
4. **Add permission action and nav entry.** Update `permissions.ts`, `DashboardShell.tsx`; verify `pnpm typecheck` and `pnpm lint`.
5. **Add feature types, validators, calculations, and tests.** Add the three files under `src/features/goals/{types,lib}`. Verify unit tests with `node --import tsx --test src/features/goals/lib/goals.test.ts`; `pnpm typecheck`.
6. **Implement API routes.** Add list/create, patch/archive, and contribution handlers. Check 401/403/400/404 cases, cross-workspace IDs, and simultaneous removal with two requests. Verify `pnpm typecheck` and route integration checks against an isolated test DB once a test harness is selected.
7. **Implement client API/hooks.** Add `goals-api.ts`, `use-goals.ts`. Verify `pnpm typecheck` and confirm query keys include active workspace and all mutations invalidate the same workspace prefix.
8. **Implement card/forms/dialog/page.** Add components and `src/app/dashboard/goals/page.tsx`; verify desktop/mobile layout, loading/empty/error states, keyboard/modal behavior, and toast feedback manually at `/dashboard/goals`.
9. **Apply local migration in a development database and smoke test.** `pnpm exec prisma migrate dev --name add_goals`; create two workspaces/users, verify workspace isolation and role enforcement, then test create/edit/add/remove/complete/overdue/archive.
10. **Run required project gates.** `pnpm lint`; `pnpm typecheck`; `pnpm build`. README describes no tests currently; do not claim API/component tests passed unless added and run through an explicitly configured test system.

## 11. Open questions and risks — anything ambiguous, with your recommended default

- **What does “delete/archive” mean?** Recommend archive as the normal operation and no permanent delete in first release; preserve contribution history.
- **Who can edit/contribute?** Existing workspace roles have feature-specific actions. Recommend OWNER/ADMIN initially, matching budgets; all members can read. Decide explicitly before adding `goals.manage` to MEMBER.
- **Are contributions actual money movement?** Recommend tracking-only contribution events, not account transactions. A goal is not an account, and no account/source field was requested. If funds must move from an account, that needs a linked transaction/transfer design and reconciliation rules.
- **Should an amount above target be accepted?** Recommend yes; users can save more than a target. Clamp percent and remaining for presentation, retain true currentAmount.
- **Should contribution history be stored?** Recommend yes because add/remove are explicit user actions and mutable currentAmount alone cannot explain balance or resolve disputes.
- **Float precision:** Float matches current schema and budget logic, but can introduce binary decimal behavior. Proposal rounds inputs to cents and uses atomic DB increment/decrement. If exact accounting is required, product must approve a schema-wide Decimal/paise migration; do not silently change only Goals.
- **Monthly contribution month counting:** Recommend current calendar month counts as one installment. Past target date returns null; complete goal returns zero. Clarify whether same-month overdue should have no required amount (proposal) or should remain one month.
- **Currency:** workspace currency exists but shared formatter is hard-coded INR. Recommend INR-only Goal UI for v1 and document the assumption; supporting non-INR goals requires currency-aware formatting and possibly currency snapshotting per goal.
- **Audit:** budget routes use `logAudit`; the existing action catalog has no Goals actions. Contribution ledger gives balance history, but create/edit/archive may also need `AUDIT_ACTIONS` additions if admin audit trail is expected.
- **Page test support:** there is no runner, React Testing Library, or API mock package. Pure calculation tests can use Node's built-in test runner through installed `tsx`; API/component tests need a deliberate tooling decision.
- **Plan limits:** budgets enforce `maxBudgets`; no `maxGoals` limit was found. Recommendation: do not invent a plan limit without a product/plan decision.

## 12. Appendix — commands you ran, files you read, searches that returned NOT FOUND

### Commands / tools

No shell commands, migrations, package installs, builds, or tests were run during this investigation. Repository inspection used read-only file listing/search/read tools. A separate terminal context reported `pnpm typecheck` exit code 0 before this report request; it was not run as part of this report investigation.

### Files read

- Root/setup: `AGENTS.md`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `prisma.config.ts`, `README.md`.
- Data: `prisma/schema.prisma`, `prisma/migrations/20260929120051_add_financial_account/migration.sql`, `prisma/migrations/20260929120452_backfill_general_accounts/migration.sql`.
- Budget reference: `src/app/api/budgets/route.ts`, `src/app/api/budgets/[id]/route.ts`, `src/app/dashboard/budgets/page.tsx`, `src/lib/budgets/budget-access.ts`, `src/lib/budgets/budgets.ts`, `src/features/budgets/api/budgets-api.ts`, `src/features/budgets/hooks/use-budgets.ts`, `src/features/budgets/types/index.ts`, `src/features/budgets/utils.ts`, `src/features/budgets/components/BudgetTable.tsx`, `src/features/budgets/components/BudgetFormModal.tsx`.
- Transaction reference: `src/app/api/finance/transactions/route.ts`, `src/app/api/finance/transactions/[id]/route.ts`, `src/features/finance/lib/validate-transaction.ts`.
- Workspace/auth/client: `src/features/workspaces/WorkspaceProvider.tsx`, `src/features/workspaces/permissions.ts`, `src/features/workspaces/hooks/use-permission.ts`, `src/lib/auth/workspaces.ts`, `src/lib/api-client.ts`, `src/components/providers/ReactQueryProvider.tsx`.
- UI/date/style: `src/components/layout/DashboardShell.tsx`, `src/components/layout/MobileTabBar.tsx`, `src/components/ui/ConfirmDialog.tsx`, `src/components/ui/Modal.tsx`, `src/lib/ui/toast.ts`, `src/features/reports/components/BudgetPerformance.tsx`, `src/lib/recurring/recurring-dates.ts`, `src/app/globals.css`, `src/app/dashboard/layout.tsx`.

### NOT FOUND searches

- Goals feature/model/routes/page/navigation: searched `goal|goals|saving|target|milestone` across project files and checked `prisma/schema.prisma`, `src/app`, `src/features`, `src/components`, and `src/lib`. Matches were only onboarding `primaryGoal`/`GOAL_OPTIONS`, marketing text/icons, or generic identifiers containing `target`.
- Test runner/tests: file search for `*test*` found only marketing testimonial files; inspected `package.json` and README testing section. No test runner, test script, or actual test file exists.
- Goals-specific progress/card/form/translation/permission: no corresponding feature files or route/navigation/permission action found. Reusable progress is native `<progress>` in report component and inline bars in budget table; no common Progress component found.
- Date-picker library / schema validation/form library: no date-fns, Zod, React Hook Form, or dedicated date picker dependency found in `package.json`; forms in the reference feature use existing local UI components and manual checks.
- Goal seed/migration: no seed file was found by `prisma/seed*`; seven existing migration entries are listed by file search. Prisma scripts are not wrapped in package scripts; README documents `npx prisma migrate dev`, `npx prisma generate`, and `npx prisma db seed`.
