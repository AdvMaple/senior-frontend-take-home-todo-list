# 09 - Test Plan (v3, completed implementation reference)

Status: **Complete.** All 209 tests passing (93 shared, 22 users, 68 todos, 26 web). Implementation matches the plan. Test coverage spans L1 through L6.

## 0. Gaps and conflicts for review (please decide)

These come from reading review v1. Nothing below is assumed in the tests until you confirm; the proposed IDs are marked **(proposed)**.

| #   | Finding                                                                                                                                                                                                                                            | Proposed resolution                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | **Optimistic create vs filters/pagination/sort (T-5..T-9 vs T-11..T-13).** The list is no longer "one list per user". Cache keys now include filter, page, page size and sort. Optimistic insert must decide which cached pages show the new item. | Key shape `todoKeys.list({ userIds, page, pageSize, sort })`. On create: `cancelQueries(todoKeys.lists())`, snapshot all list queries with `getQueriesData`, insert the temp item only into queries whose filter includes the assignee AND that are page 1 with sort = newest first; adjust `total`; drop the last item if the page is full. Rollback restores all snapshots. Settle: invalidate `todoKeys.lists()`. **** |
| G2  | **T-4 "list for one user" vs T-11 "multi-select filter".**                                                                                                                                                                                         | Treat T-4 as the filter with one selected user (`/todos?userId=a&userId=b`). The `userId` search param becomes an array (`userIds`). R-1/R-2 wording to be updated. OK, update the wording.                                                                                                                                                                                                                               |
| G3  | **Pagination mode.** Offset/page-number (T-12) vs lazy loading for the assignee dropdown (answer 2).                                                                                                                                               | Todo list: page-number + page-size, `placeholderData: keepPreviousData`. Assignee dropdown: `useInfiniteQuery` with a "load more"/scroll sentinel. Both need paginated API methods (see G6). OK, add them                                                                                                                                                                                                                 |
| G4  | **Answer 4 implies a "done" state and delete.** The model has no `completed` toggle requirement, and no delete requirement.                                                                                                                        | **(proposed T-16)** Toggle done (optimistic). **(proposed T-17)** Delete only allowed on done todos, selectable (checkbox) with confirm; bulk delete optional. Keep as Should unless you want Must. OK, remove the optimistic update, when update fail, have a message toast or popup to show error instead                                                                                                               |
| G5  | **Answer 1: rate limit for username creation** (and an error "popup").                                                                                                                                                                             | **(proposed U-7)** Client-side: disable submit while pending + debounce/throttle (one request per N ms). API: in-memory fake returns `ApiError('RATE_LIMITED')` after X creates per window. Error is shown as toast (sonner) AND field error for accessibility (toast alone is not announced reliably). Need shadcn `sonner`. Case-insensitive uniqueness stays.                                                          |
| G6  | **API surface grows.** New methods: `listUsers({ cursor/page, limit, search })`, `listTodos({ userIds, page, pageSize, sort })` returning `{ items, total }`, `updateTodo`, `deleteTodo(s)`. The scaffold `api.ts` does not match.                 | `05-in-memory-api.md` to be updated after review. Request cancellation: API methods accept `AbortSignal` so cancelled queries really stop (T-14).                                                                                                                                                                                                                                                                         |
| G7  | **T-14 text mentions A-6.** Cancelling stale requests in TanStack Query is done by passing `signal` from the query function context, not by the hook alone. Race protection comes from query keys + `placeholderData`.                             | Test both: rapid page/filter changes show only the latest data; aborted request does not overwrite.                                                                                                                                                                                                                                                                                                                       |
| G8  | **Create-user navigates to `/todos` (answer 3), but U-1 says `/users/$userId`.**                                                                                                                                                                   | Update U-1: navigate to `/todos?userIds=<newId>`; `/users/$userId` still exists for U-4. OK                                                                                                                                                                                                                                                                                                                               |
| G9  | **N-5 sits outside the table** in `08` (markdown). Cosmetic.                                                                                                                                                                                       | Fix when you next edit.                                                                                                                                                                                                                                                                                                                                                                                                   |
| G10 | **A-6/A-7 wording.** Interpreted as: all query hooks live in the feature packages' `hooks/` and are exported (not inlined in components); all keys come from `queries/keys.ts` factories; no string-literal keys elsewhere. OK                     | Enforced by a unit test of key factories plus a lint/grep test (no `queryKey: [` literals outside `queries/`).                                                                                                                                                                                                                                                                                                            |

## 0.1 Decisions after your review (applied in v3)

- G2, G3, G8, G10 accepted as proposed. G4 accepted **with change**: toggle done and delete are NOT optimistic; failure shows an error toast (see `../user-design-decisions.md` section 3). G1, G5, G6, G7, G9: no objection, treated as accepted.
- New requirements covered below: U-4 (user's todos on detail), U-8 (theme), U-9, S-3, T-15, T-16, T-17, N-8.
- Table rows in section 3 mentioning optimistic toggle/delete are superseded by the L3b/L4b tables.

Open items from this document (budgets, G1/G5/G6/G7/G9 confirmation, rate-limit values) are tracked in `../open-questions.md`.

## 1. Tooling

Vitest 5 + jsdom, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` (already installed). To add: `vitest-axe` (a11y smoke), `msw` NOT used (in-memory API is injected directly). Per-package `vitest` config; `pnpm test` runs via Turbo. Tests colocated as `*.test.ts(x)`. Shared helpers in `shared/src/test/`: `createTestApi`, `createTestQueryClient`, `renderWithProviders`, `renderRoute`, `deferred()`.

## 2. Rules

- Fresh in-memory API and QueryClient per test (`retry: false`, `gcTime: Infinity`, latency 0).
- Control timing with `deferred()` promises and fake timers, never sleeps.
- Query by role, label, text. No snapshots, no class assertions.
- Types from the shared types files (D3). Keys from key factories (A-7).
- Each test names its requirement ID in the `describe`/`it` title, e.g. `it("T-6: rolls back ...")`.

## 3. Test matrix

### L1 - In-memory API (`shared/api/*.test.ts`)

| Test                                                                                           | Req           |
| ---------------------------------------------------------------------------------------------- | ------------- |
| createUser returns user with id and createdAt                                                  | U-1           |
| duplicate username (case-insensitive) -> CONFLICT                                              | U-3           |
| create users faster than limit -> RATE_LIMITED, recovers after window (fake timers)            | U-7           |
| getUser unknown id -> NOT_FOUND                                                                | U-5           |
| listUsers: paginates with cursor/page, `hasMore`, stable order, search                         | Q2 (dropdown) |
| createTodo unknown assignee -> NOT_FOUND                                                       | T-3           |
| listTodos filters by multiple userIds, empty filter = all                                      | T-4, T-11     |
| listTodos sorts by createdAt desc; ties stable                                                 | T-13          |
| listTodos returns correct `items`/`total` for page, pageSize; page out of range -> empty items | T-12          |
| updateTodo toggles done; deleteTodo only for done, else VALIDATION error                       | T-16, T-17    |
| `failNext(op)` fails exactly one call of that op                                               | A-4, T-6      |
| aborted `AbortSignal` rejects with AbortError and does not mutate state                        | T-14          |
| returned objects are copies                                                                    | A-4           |

### L2 - Schemas and key factories

| Test                                                                                                                                 | Req             |
| ------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| username: empty/short/long/invalid chars -> exact messages; trims                                                                    | U-2             |
| title 1-120 after trim; assignee id format                                                                                           | T-2             |
| todos search schema: `userIds` array/single/garbage fallback, `page` >= 1, `pageSize` in allowed set, `sort` enum; defaults applied  | R-2, T-11..T-13 |
| `todoKeys`/`userKeys`: hierarchical (`lists()` is prefix of `list(filters)`), deterministic for equal filters regardless of id order | A-7             |
| no `queryKey: [` literal outside `queries/` folders (grep test)                                                                      | A-7, G10        |
| query hooks exported from `@app/users` / `@app/todos` public API                                                                     | A-6             |

### L3a - Data refresh (D-1..D-3)

| Test                                                                                                                         | Req      |
| ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| useCreateUser success invalidates `userKeys.all`; a mounted `useUsersInfinite` and `useUser` refetch (spy on API call count) | D-1      |
| useCreateTodo settle (success AND failure) invalidates `todoKeys.lists()`; mounted list refetches and shows server data      | D-2      |
| useToggleTodo and useDeleteTodos settle invalidate `todoKeys.lists()`                                                        | D-2      |
| invalidation targets only the expected prefix (users unaffected by todo mutations and vice versa)                            | D-3      |
| no string-literal keys in `invalidateQueries` calls (grep test, with G10)                                                    | D-3, A-7 |

### L3 - Hooks / cache integration (most important)

`todos/hooks/useCreateTodo.test.tsx`

| Test                                                                                   | Req     |
| -------------------------------------------------------------------------------------- | ------- |
| item in matching cached list before API resolves, flagged pending; `total` incremented | T-5, G1 |
| on success temp id replaced by server id, exactly one item, no duplicates              | T-7     |
| on failure every touched list equals its pre-submit snapshot; error exposed            | T-6     |
| optimistic item not inserted into lists whose filter excludes the assignee             | T-8, G1 |
| not inserted into page > 1 or non-default sort; list is invalidated instead            | G1      |
| user A mutation in flight while viewing B: B's lists unchanged                         | T-8     |
| two overlapping creates, second fails: first persists, second rolled back              | T-9     |
| after settle, lists are refetched and equal server truth                               | T-7     |

`todos/hooks/useTodos.test.tsx` (list behavior)

| Test                                                                                      | Req             |
| ----------------------------------------------------------------------------------------- | --------------- |
| changing page/pageSize/filter/sort changes the query key and refetches                    | T-11..T-13, A-7 |
| `keepPreviousData`: previous page stays visible with `isPlaceholderData` while next loads | T-14            |
| rapid change A->B->C: only C's data is rendered, A and B signals aborted                  | T-14, G7        |
| late response of an aborted/stale request never overwrites newer data                     | T-14            |
| default sort = newest first                                                               | T-13            |

`users/hooks/useUsersInfinite.test.tsx`: loads first page, `fetchNextPage` appends, stops at `hasMore=false`, search resets pages (Q2). `useCreateUser`: success sets `selectedUserIdAtom` (S-1) and invalidates users lists. `useUser`: NOT_FOUND surfaces as typed error (U-5). `useToggleTodo`/`useDeleteTodos`: NOT optimistic (see L3b).

### L3b - Toggle and delete (T-16, T-17, not optimistic)

| Test                                                                                               | Req       |
| -------------------------------------------------------------------------------------------------- | --------- |
| toggle: cache is unchanged until the server answers (no optimistic write); row shows pending state | T-16      |
| toggle success: lists refetched, row is done                                                       | T-16, D-2 |
| toggle failure: error toast shown, row unchanged, lists still refetched on settle                  | T-16, N-8 |
| delete success: rows removed only after the server answers; selection cleared; lists refetched     | T-17, D-2 |
| delete failure: error toast, rows remain and stay selected                                         | T-17, N-8 |
| delete of a not-done todo is rejected by the API and not offered by the UI                         | T-17      |

### L3c - Theme (S-3)

| Test                                                                                | Req      |
| ----------------------------------------------------------------------------------- | -------- |
| `themeAtom` defaults to `system`; persists to `localStorage` and restores on reload | S-3, U-8 |
| `system` follows `matchMedia("(prefers-color-scheme: dark)")` and reacts to changes | S-3      |
| setting `dark` adds class `dark` to `<html>`; `light` removes it                    | U-8      |

### L4 - Components

| Test                                                                                                                              | Req                |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| CreateUserForm: labelled input; Enter submits; invalid shows message, `aria-invalid`, `aria-describedby`, focus moves to field    | U-1, U-2, X-1, X-2 |
| duplicate username -> toast AND inline error, value kept                                                                          | U-3                |
| submit disabled while pending; rapid double submit sends one request                                                              | U-7                |
| RATE_LIMITED shows a retry-after message                                                                                          | U-7                |
| CreateTodoForm: labels, errors linked, assignee is a combobox (keyboard: open, type, arrows, Enter, Esc)                          | T-1, T-2, X-1, X-2 |
| assignee dropdown: loads more on scroll/"load more"; search filters; selected value announced                                     | Q2                 |
| unknown assignee error shown on field                                                                                             | T-3                |
| TodoList: `ul/li`, empty state "No todos yet", pending item marked (`aria-busy`)                                                  | T-4, T-5           |
| filter multi-select: choose several users, chips shown, clear all, URL search updates                                             | T-11               |
| pagination controls: page buttons, page-size select, `aria-current` on page, disabled at edges, resets to page 1 on filter change | T-12               |
| loading between pages: `role="status"`, previous content dimmed not blanked                                                       | T-14               |
| select done todos (checkbox), delete with confirm dialog; not-done rows cannot be selected for delete                             | T-17               |
| vitest-axe: no violations on forms, list, dialog                                                                                  | X-1, X-4           |

### L4b - User detail and errors

| Test                                                                                                              | Req           |
| ----------------------------------------------------------------------------------------------------------------- | ------------- |
| detail shows username, id, created date and the user's todos list (filter locked to that user)                    | U-4, U-9      |
| detail list supports pagination and sort; creating/toggling/deleting a todo refreshes it                          | U-9, D-2      |
| theme control: radio group light/dark/system, keyboard operable, `aria-checked`, applies immediately and persists | U-8, X-1, X-2 |
| detail for a user with no todos shows "No todos yet"                                                              | U-9           |
| validation errors are inline only; duplicate username shows inline error AND toast; rate limit shows toast + hint | N-8, U-3, U-7 |
| create todo failure shows toast AND inline `role="alert"`; load error shows inline "Try again" (no toast)         | N-8, T-6, U-6 |
| toasts: failure uses `role="alert"`, success `role="status"`, dismissible                                         | N-8, X-4      |

### L5 - Route integration (`apps/web`, memory history; 3 smoke tests already exist)

| Test                                                                                                                            | Req             |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `/` redirects to `/todos` (exists)                                                                                              | R-1             |
| unknown path -> 404 (exists)                                                                                                    | R-4             |
| `/users/$userId` loads user; missing -> not-found UI                                                                            | U-4, U-5        |
| `/todos` search params round-trip: set filter/page/sort -> URL -> reload shows same state; invalid params fall back             | R-2, T-11..T-13 |
| creating a user navigates to `/todos?userIds=<newId>` and selects the user (S-1)                                                | U-1, G8         |
| journey: create user -> create todo -> optimistic row appears on page 1 -> settles; forced failure -> rollback + error          | T-5..T-7        |
| journey: open user detail, switch to dark, reload, theme persists; create a todo for that user, it appears in their detail list | U-8, U-9, D-2   |
| journey: filter by 2 users, paginate, change sort, no stale flicker                                                             | T-11..T-14      |
| nav link has `aria-current="page"` on active route; skip link works                                                             | R-5, X-3        |

### L6 - Static and architecture checks (`pnpm lint`, `pnpm typecheck`)

| Check                                                                                               | Req      |
| --------------------------------------------------------------------------------------------------- | -------- |
| `no-restricted-imports` users <-> todos (already configured)                                        | A-2      |
| jsx-a11y, `@tanstack/eslint-plugin-query`, `consistent-type-imports`, `consistent-type-definitions` | X-1, A-3 |
| script test: `users`/`todos` package.json do not list each other                                    | A-2      |
| `@app/shared/ui` components only from shadcn (files carry shadcn header/cva) - review item          | N-5      |
| `pnpm typecheck`, `lint`, `test`, `build` all pass                                                  | N-1      |

## 4. Workflow for agents

1. Load skills: `pnpm exec intent list`, then `intent load` for the TanStack package relevant to the task (D7).
2. Read the requirement IDs for the task. Write failing tests with IDs in titles; commit.
3. Implement until green; run `pnpm lint && pnpm typecheck && pnpm test`.
4. Update the traceability table; note deviations in `decisions.md`.

## 5. Suggested implementation order (small, reviewable steps) — COMPLETED

As outlined, all steps 1–5 completed:

1. Shared types, key factories, schemas, in-memory API with dataset profiles (L1, L2, N-7) ✓
2. Users: hooks + forms (L3/L4 for users), navigation to `/todos` ✓
3. Todos list: filters, pagination, sort, cancellation (L3/L4 list) ✓
4. Optimistic create + rollback (L3 create) — the key requirement ✓
5. Done/delete, rate limit, a11y pass, README ✓

## 6. Traceability

| Req                                                            | Test file                                                                                  | Status                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------- |
| R-1, R-4, R-5                                                  | `apps/web/src/routes/*.test.tsx`                                                           | done (L5 route tests, 26 tests)    |
| N-5                                                            | `apps/web/src/shared-ui.test.tsx`                                                          | done (L6 smoke)                    |
| U-1..U-3, U-5, U-7, T-1..T-4, T-11..T-14, T-16, T-17, A-4, N-7 | `packages/shared/src/api/in-memory-api.test.ts`, `packages/shared/src/api/dataset.test.ts` | done (L1, 93 tests)                |
| U-2, T-2, R-2, T-11..T-13, A-7, A-6                            | `packages/shared/src/schemas/*.test.ts`, `packages/shared/src/keys/keys.test.ts`           | done (L2, L6; 93 tests)            |
| T-5..T-9, T-15, T-16, T-17                                     | `packages/todos/src/hooks/useCreateTodo.test.tsx`, `packages/todos/src/hooks/*.test.tsx`   | done (L3, L3b; 68 tests)           |
| T-11..T-14                                                     | `packages/todos/src/hooks/useTodos.test.tsx`, `packages/todos/src/components/*.test.tsx`   | done (L3, L4; 68 tests)            |
| U-1..U-7, U-8, U-9, D-1, D-2, D-3, S-1, S-3                    | `packages/users/src/**`                                                                    | done (L3/L4; 22 tests)             |
| L3c (theme), L4b (detail, errors)                              | `packages/users/src/components/**`, `packages/todos/src/components/**`                     | done (L3c, L4b; 90 combined tests) |
| L6 (lint, typecheck, architecture)                             | `pnpm lint && pnpm typecheck` via Turbo                                                    | pass                               |

## 7. Production outline (for README, not implemented)

Playwright e2e of the create journey, axe in CI, contract tests vs OpenAPI when a real API exists, coverage thresholds on feature packages, Turbo remote cache, load/rate-limit tests server-side.

## 8. Performance measurement plan (decision D12)

Goal: show the frontend stays fast under load (1,000 users, 10,000 todos) and that pagination, filtering and the optimistic update do not degrade. Numbers are **budgets to confirm or revise at review**, not measured results.

### 8.1 Dataset

Use the `load` profile of the in-memory API (see `05-in-memory-api.md`). Deterministic seed (42). A dedicated test checks: counts (1,000 / 10,000), unique usernames, seed reproducibility, generation time under 200 ms, distribution has empty, light and heavy users.

### 8.2 What we measure and how

| Area        | Metric                                                                                                               | Tool                                                                           | Budget                                                                                                         | Req             |
| ----------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------------- |
| Load        | Bundle size per route chunk (gzip), main entry                                                                       | `vite build` output + `size-limit` or `rollup-plugin-visualizer`               | main under 150 kB gzip; each route chunk under 30 kB gzip                                                      | R-3             |
| Load        | LCP, TBT, CLS, FCP on `/todos` with `?dataset=load`                                                                  | Lighthouse CLI (`lighthouse` against `vite preview`), 3 runs, median           | LCP under 2.0 s, TBT under 200 ms, CLS under 0.05 (desktop profile)                                            | N-6             |
| Render      | Number of rendered rows and DOM nodes on the list page                                                               | Vitest + Testing Library                                                       | rows equal `pageSize` (max 25); DOM nodes under 1,500 on `/todos`                                              | T-12, N-6       |
| Render      | Re-render counts: typing in the title field must not re-render the list; changing filter must not re-render the form | React Profiler (`<Profiler>` in tests) or render-count spies                   | list re-renders 0 times on title keystrokes; form 0 on filter change                                           | N-6             |
| Interaction | Time from click to pagination/filter/sort UI update (INP-like)                                                       | Playwright trace or `performance.measure` marks via `web-vitals` in dev        | under 100 ms to first visual response (placeholder data); under 200 ms INP                                     | T-12..T-14, N-6 |
| Interaction | Optimistic create: time from submit to row visible                                                                   | Vitest fake timers + Profiler; Playwright check with `slow` latency            | row visible within one frame (under 50 ms) while API takes 2 s                                                 | T-5             |
| Dropdown    | Assignee combobox with 1,000 users: first open time, memory of options                                               | Vitest (options rendered count), Playwright                                    | renders at most one page of options (about 20); scroll/load-more appends without re-rendering previous options | Q2, N-6         |
| API/cache   | Request count per user action (no duplicate/N+1, no refetch storms)                                                  | API call-count spies in tests                                                  | one list request per page/filter change; zero extra requests on step back to a cached page (staleTime)         | A-7, D-2        |
| Cache       | Memory: `queryClient.getQueryCache().getAll().length` and `gcTime` behavior after paging through 50 pages            | Vitest                                                                         | cache entries bounded (old pages garbage-collected after `gcTime`); no growth beyond window                    | N-6             |
| Cache       | Optimistic update cost with many cached list queries                                                                 | Vitest + `performance.now()`                                                   | `onMutate` over 50 cached lists under 10 ms                                                                    | T-15            |
| Memory      | JS heap after 100 create/page cycles (leak check)                                                                    | Playwright + CDP `Performance.getMetrics` or Chrome DevTools MCP heap snapshot | growth under 10% after GC                                                                                      | N-6             |
| Stress      | Rapid interaction: 20 filter/page changes within 1 s                                                                 | Vitest (abort counts) and Playwright                                           | only the last request's data rendered; earlier requests aborted; no console errors                             | T-14            |

### 8.3 How to run (to implement with the app)

- `pnpm test` includes cheap, deterministic checks (render counts, DOM nodes, call counts, cache bounds, dataset facts). Fail the build on regression.
- `pnpm perf` (new script, not in CI): builds, serves `vite preview`, runs Lighthouse (3 runs) on `/todos?dataset=load`, and a Playwright script for interaction timings; writes `perf/report.json` + a short `perf/README.md` table (date, machine, node version). Results copied into the README Performance section.
- Manual aid: Chrome DevTools MCP (already available in this environment) for performance traces and heap snapshots; React DevTools Profiler flame graph screenshot for the list.
- Always measure the production build (`vite preview`), never the dev server. Record machine and CPU throttling (4x slowdown for the mobile-ish run).

### 8.4 Techniques the tests should confirm are in use

- Server-side pagination only; `placeholderData: keepPreviousData`; stable query keys; `select`/derived data memoized only where profiling shows a need.
- Route code-splitting; no heavy deps in the initial chunk.
- List rows are memoized only if the profiler shows re-renders; no virtualization needed because page size is capped (note: if "all on one page" were allowed, we would add `@tanstack/react-virtual`).
- Combobox options paginated (infinite query), debounced search (about 250 ms) with abort of stale requests.

### 8.5 Proposed new requirement IDs (need approval)

| ID  | Pri | Requirement                                                                                                |
| --- | --- | ---------------------------------------------------------------------------------------------------------- |
| N-6 | S   | Performance budgets in 8.2 are met on the `load` dataset, and results are recorded in the README           |
| N-7 | M   | Fake API ships `small`, `demo`, `load` dataset profiles; `load` = 1,000 users, 10,000 todos, deterministic |
