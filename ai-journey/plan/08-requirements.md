# 08 - Requirements (V2 draft)

Status: **V2 DRAFT, pending approval.** V1 was human-reviewed 2026-11-08. V2 applies the review of `09-test-plan.md` (gaps G1-G10), adds user-detail requirements (U-4 extended, U-8, U-9), theme preference (S-3), non-optimistic toggle/delete (T-16, T-17), rate limit (U-7), performance (N-6, N-7). Design choices are in `../user-design-decisions.md`. Changes from V1 are tagged **[V2]**. IDs are used in tests (`09-test-plan.md`).
Priority: M = must (task statement), S = should, C = could.

## Users

| ID  | Pri | Requirement                     | Acceptance criteria                                                                                                                                                                                                                 |
| --- | --- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U-1 | M   | Create a user by username       | Form with label "Username"; valid submit creates user and navigates to `/todos?userIds=<newId>` **[V2, G8]**                                                                                                                        |
| U-2 | M   | Username validation             | 3-20 chars, letters/digits/`_`/`-`, trimmed; messages: "Username is required", "Username must be at least 3 characters", "Username must be at most 20 characters", "Use letters, numbers, - or _ only"                              |
| U-3 | M   | Duplicate username rejected     | API returns CONFLICT (case-insensitive); form shows "That username is already taken" in `role="alert"`/field error; values kept                                                                                                     |
| U-4 | M   | View user by ID                 | `/users/$userId` shows username, id, created date, and the user's todos (U-9) **[V2]**                                                                                                                                              |
| U-5 | M   | Unknown user                    | `/users/<missing>` shows a not-found state with link back; no crash                                                                                                                                                                 |
| U-6 | S   | Loading and error states        | Loading uses `role="status"`; non-404 error shows message and "Try again" button                                                                                                                                                    |
| U-7 | M   | Rate limit on user creation     | **[V2]** Submit disabled while pending and throttled client-side; API returns `RATE_LIMITED` after 3 creations in 10 s; error shown as toast and inline message with retry hint                                                     |
| U-8 | M   | Theme preference on user detail | **[V2]** Detail view has a control (light / dark / system) to change the appearance; applied immediately app-wide (class `dark` on `<html>`), persisted across reloads, default = system. Stored in Jotai (S-3)                     |
| U-9 | M   | User's todos on detail page     | **[V2]** `/users/$userId` shows that user's todos directly (same list component, filter locked to this user, pagination and sort available); empty state "No todos yet"; loading/error states; refreshes after todo mutations (D-2) |

## ToDo items

| ID   | Pri | Requirement                                       | Acceptance criteria                                                                                                                                                                                                                                               |
| ---- | --- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-1  | M   | Create a todo with title and assignee user ID     | Form with labels "Title", "Assignee (user ID)"                                                                                                                                                                                                                    |
| T-2  | M   | Todo validation                                   | Title required, 1-120 chars after trim; assignee required, valid id format; messages specified like U-2                                                                                                                                                           |
| T-3  | M   | Assignee must exist                               | API returns NOT_FOUND for unknown assignee; field error "No user with that ID"                                                                                                                                                                                    |
| T-4  | M   | List todos for a user                             | `/todos?userIds=<id>` (one selected user = filter, G2) lists that user's todos, newest first **[V2]**; empty state "No todos yet"                                                                                                                                 |
| T-5  | M   | **Optimistic create**                             | On submit the item is in the assignee's list immediately (marked pending), before API resolves                                                                                                                                                                    |
| T-6  | M   | **Rollback on failure**                           | If the mutation fails, the item disappears, list equals pre-submit state, an error is shown, form values preserved                                                                                                                                                |
| T-7  | M   | Reconcile on success                              | After success the temp item is replaced by the server item (real id), no duplicates, no flicker                                                                                                                                                                   |
| T-8  | M   | Per-user cache isolation                          | Optimistic write/rollback touches only the assignee's list; switching users mid-flight does not leak items                                                                                                                                                        |
| T-9  | M   | Overlapping submits                               | Two in-flight creates: each rolls back independently; successful one persists                                                                                                                                                                                     |
| T-15 | M   | Optimistic create across filtered/paginated lists | **[V2, G1]** Temp item inserted only into cached list queries whose filter includes the assignee, that are page 1 and sorted newest first (`total` +1, last item dropped if page full); all other lists are invalidated; rollback restores every touched snapshot |
| T-10 | S   | Todo status filter (Jotai)                        | all/pending-sync filter persists across route changes within a session                                                                                                                                                                                            |
| T-11 | M   | Todo list filters                                 | The Todo list should have a filter input(multi select) to select who to filters by                                                                                                                                                                                |
| T-12 | M   | Todo list pagination                              | The list should be paginated, perpage selection, page number selection                                                                                                                                                                                            |
| T-13 | M   | Todo list sorting                                 | The list should be sorted by creation date, latest first                                                                                                                                                                                                          |
| T-14 | M   | Todo list pagination change loading state         | The list should cancle previos request to ensure no race condition (A-6 should already be used, as useQuery hook from tanstack can prevent stale data changes)                                                                                                    |
| T-16 | M   | Toggle done (not optimistic)                      | **[V2, G4]** A todo can be marked done. No optimistic update: row shows a pending state until the server answers; on failure an error toast is shown and the row stays unchanged; on settle lists refetch (D-2)                                                   |
| T-17 | M   | Delete done todos (not optimistic)                | **[V2, G4]** Only done todos are selectable (checkbox); confirm dialog; no optimistic removal; on failure an error toast is shown and rows remain; on settle lists refetch (D-2)                                                                                  |

## Routing and navigation

| ID  | Pri | Requirement                                      | Acceptance criteria                                                                                                   |
| --- | --- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| R-1 | M   | TanStack Router with typed params/search         | Routes: `/` (redirect `/todos`), `/users/new`, `/users/$userId`, `/todos?userIds=&page=&pageSize=&sort=` **[V2, G2]** |
| R-2 | M   | Search param validated                           | Invalid `userIds`/`page`/`pageSize`/`sort` values fall back to defaults safely **[V2]** (Zod `validateSearch`)        |
| R-3 | S   | Route-level code splitting and preload on intent | `autoCodeSplitting`, `defaultPreload: 'intent'`                                                                       |
| R-4 | M   | Root not-found and error components              | Unknown path shows 404 page                                                                                           |
| R-5 | M   | Nav links with active state, keyboard operable   | Visible focus; `aria-current="page"` on active link                                                                   |

## State

| ID  | Pri | Requirement                | Acceptance criteria                                                                                                                                                           |
| --- | --- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-1 | M   | Jotai for selected user id | `selectedUserIdAtom` set when a user is created/viewed; used as default assignee and for `/todos` when no search param                                                        |
| S-2 | M   | Server data not in Jotai   | Users/todos only in TanStack Query cache                                                                                                                                      |
| S-3 | M   | Jotai for theme preference | **[V2]** `themeAtom` (`light` / `dark` / `system`) via `atomWithStorage`; an effect at the app root applies the `dark` class and follows `prefers-color-scheme` when `system` |

## Architecture

| ID  | Pri | Requirement                                    | Acceptance criteria                                                           |
| --- | --- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| A-1 | M   | Monorepo packages                              | `apps/web`, `@app/users`, `@app/todos`, `@app/shared`, `@app/config`          |
| A-2 | M   | No sibling imports                             | `users` never imports `todos` and vice versa; enforced by lint + package.json |
| A-3 | M   | Types in shared files                          | No inline prop/domain types (decision D3)                                     |
| A-4 | M   | In-memory API behind `ApiClient` interface     | Latency, failure injection, seed data; swappable (see 05)                     |
| A-5 | M   | Business logic / data / presentation separated | Hooks own logic, `api/` owns data access, components presentational           |
| A-6 | M   | Share tanstack useQuery hook                   | users and todo should be shared hook for reuseable                            |
| A-7 | M   | tanstack query key mangement                   | Ensure to query key are managed                                               |

## Accessibility

| ID  | Pri | Requirement                    | Acceptance criteria                                                               |
| --- | --- | ------------------------------ | --------------------------------------------------------------------------------- |
| X-1 | M   | Labelled inputs, errors linked | `label htmlFor`, `aria-invalid`, `aria-describedby`                               |
| X-2 | M   | Keyboard-only usable           | Tab order logical; Enter submits; first invalid field focused after failed submit |
| X-3 | S   | Landmarks and skip link        | `header/nav/main`, "Skip to content"                                              |
| X-4 | S   | Status announcements           | Pending/loading `role="status"`; submit errors `role="alert"`                     |

## Non-functional / deliverables

| ID  | Pri | Requirement                                                                                               |
| --- | --- | --------------------------------------------------------------------------------------------------------- |
| N-1 | M   | `pnpm lint`, `typecheck`, `test`, `build` all pass                                                        |
| N-2 | M   | README (architecture, trade-offs, why this split, run instructions), reflections (performance, testing)   |
| N-3 | M   | `ai-journey/` complete (plan, prompts, toolchain, judgment, session export)                               |
| N-4 | C   | React Compiler / extra perf work: out of scope                                                            |
| N-5 | M   | UI built from shadcn/ui components in `shared/ui` (D5); no hand-rolled primitives                         |
| N-6 | S   | Performance budgets met on the `load` dataset and recorded in README (`09` section 8)                     |
| N-7 | M   | Fake API ships `small`, `demo`, `load` profiles; `load` = 1,000 users + 10,000 todos, deterministic       |
| N-8 | M   | Error feedback follows `../user-design-decisions.md` (inline for validation, toast for mutation failures) |

## Data freshness (added V1.1)

| ID  | Pri | Requirement                                       | Acceptance criteria                                                                                                                                                                                                                                                     |
| --- | --- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | M   | Refresh user data after a user is created         | On create-user success, user-related queries are invalidated (`userKeys.all`: user lists, the assignee dropdown, user detail) so every users hook refetches without a page reload                                                                                       |
| D-2 | M   | Refresh todo data after todo create/update/delete | On settle (success or failure) of create, update (toggle done) and delete, all todo list queries (`todoKeys.lists()`) and the affected detail are invalidated and refetched, so the UI shows server truth. Optimistic changes (T-5, T-6) are reconciled by this refresh |
| D-3 | M   | Invalidation uses key factories only              | Invalidation calls use `userKeys`/`todoKeys` (A-7), never string literals; scoped to the narrowest prefix that covers the change                                                                                                                                        |

## Out of scope

Auth, real backend, persistence across reloads, pixel-perfect design, CI/CD, exhaustive coverage.

## Open questions

Moved to `../open-questions.md` (V1 answers are recorded there under "Answered").
