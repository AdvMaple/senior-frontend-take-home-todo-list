# Users and Todos (Senior Frontend take-home)

A small React + TypeScript + Vite app in a Turborepo monorepo. You can create users, view a user by ID, create todos with an assignee, and list todos with filter, sort and pagination. Creating a todo is **optimistic** with rollback.

## Run it

Requirements: Node 22 (`.nvmrc`), pnpm 10.

```bash
pnpm install
pnpm dev          # web app on http://localhost:5173
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

The backend is an in-memory fake (`packages/shared/src/api`) with a fixed demo profile (small: 10 users, 50 todos). It is fully typed and injectable for testing.

## Architecture and why the monorepo is split this way

```
apps/web          routing, pages, composition (the only place that knows both features)
packages/users    user feature: hooks, components, forms
packages/todos    todo feature: hooks, components, list
packages/shared   API client + in-memory backend, types, Zod schemas, query keys,
                  Jotai atoms, shadcn UI, test helpers, ESLint/TS config in packages/config
```

- **Features never import each other.** This is enforced by pnpm (neither `package.json` lists the other) and by an ESLint `no-restricted-imports` rule. Anything both need (types, query keys, the API client, atoms, UI) lives in `shared`. When two features must appear together, `apps/web` composes them. For example, the assignee picker is a `users` component that `apps/web` passes into the todo form, and the user detail page receives the user's todo list as a slot.
- **Separation of concerns inside a feature:** `hooks/` (TanStack Query, business logic) -> `components/` (presentation) -> shared API client (data access). Components never call the API. Types live in `*.types.ts` files.
- **Routing (TanStack Router, file-based, code-split):** `/` redirects to `/todos`; `/todos?userIds=&page=&pageSize=&sort=`; `/users/new`; `/users/$userId`; not-found page. List state (filter, page, size, sort) lives in the URL and is validated with Zod, so reload, back and links work.
- **State has three homes:** server data in TanStack Query, list state in the URL, cross-cutting UI state in Jotai (`selectedUserIdAtom`, `themeAtom`). Jotai holds no server data.
- **Optimistic create (the key requirement):** on submit we cancel in-flight list queries, snapshot every cached todo list, and insert a pending item only into lists that should contain it (assignee in the filter, page 1, newest first). On error, every snapshot is restored and an error toast plus an inline alert appear. On settle, lists are refetched, so the cache converges to server truth. Toggle-done and delete are deliberately **not** optimistic: they refetch and show a toast on failure.
- **Validation:** Zod. It is small, one schema serves the form and the API boundary, and messages are written for users. Field errors are inline and linked with `aria-describedby`; mutation failures also use a toast. Details: `ai-journey/user-design-decisions.md`.
- **UI:** shadcn/ui components (accessible Radix primitives, Tailwind) copied into `shared/ui`; light/dark/system theme chosen on the user detail page.

### Trade-offs

- pnpm workspaces plus ESLint rules over a heavier tool (Nx boundaries): enough for 4 packages, no extra tooling.
- Server-side pagination in the fake API keeps the UI honest (it only ever gets one page), at the cost of writing a more realistic fake.
- Optimistic insert only into matching cached lists is more code than "invalidate everything", but gives instant feedback without showing the item in the wrong list or page.
- In-memory data is lost on reload (explicitly acceptable for the task).

## Reflection

**Performance**

- `pnpm perf` rebuilds the app and checks gzipped JavaScript bundles against the documented budget: 150 KiB for application/shared dependency chunks and 30 KiB for route chunks. It writes the measured artifacts to `perf/report.json`; Lighthouse and interaction timings are deliberately left as a production/CI follow-up rather than claimed as measured here.
- Server-side pagination with `keepPreviousData`, stable query keys, and cancelled stale requests ensure the UI renders only the current page (5 to 25 rows) and never flashes empty between pages. Routes are code-split, and the assignee dropdown loads users page by page with debounced search.

**Testing strategy (production)**

- Many fast unit/integration tests (Vitest, Testing Library, in-memory API injected, no network): schemas, key factories, API behaviour, and especially the optimistic-update hooks (insert, rollback, overlapping submits, filtered/paginated cache). Each test names a requirement ID.
- Component tests by role and label, with `vitest-axe` for accessibility and keyboard checks on forms and the combobox; a few route-level journeys with memory history.
- For production add Playwright end-to-end for the create journey, contract tests against a real API/OpenAPI schema, and performance budgets (Lighthouse CI, bundle size) in the pipeline.

## AI journey

See [`ai-journey/`](./ai-journey): the plan (`plan/`), requirements and test plan written before code, decisions and where I overrode the AI (`decisions.md`, `judgment.md`), tools, models, skills and MCP servers (`toolchain.md`), key prompts (`prompts.md`), my design decisions (`user-design-decisions.md`), open questions (`open-questions.md`), the UI mockup, and the session export.

## Status

| Area                                                                    | State |
| ----------------------------------------------------------------------- | ----- |
| Plan, requirements V2, test plan                                        | done  |
| `shared` (types, schemas, keys, in-memory API, UI, atoms, test helpers) | done  |
| `users` (hooks, create form, detail, combobox, theme control)           | done  |
| `todos` hooks (list, optimistic create, toggle, delete)                 | done  |
| `todos` UI, `apps/web` wiring, composition                              | done  |
| Tests (193 passing: 93 shared, 23 users, 51 todos, 26 web)              | done  |
