# 06 - Tests

Stack: Vitest + jsdom + Testing Library + user-event. Task says tests are optional, but we implement a focused set plus an outline in the README.

## Test pyramid

1. **Unit (shared/api):** in-memory API: create/get user, duplicate username, NOT_FOUND, todo for missing assignee, failure injection, copy semantics.
2. **Unit (schemas):** Zod username/title rules and messages.
3. **Hook/integration (todos) - most important:** `useCreateTodo`
   - success: item appears immediately (temp id), then replaced by the real id after settle.
   - failure: `failNext('createTodo')` -> list rolled back to the previous state, error shown, form values preserved.
   - switching user during pending mutation does not touch the other user's list.
   - two overlapping submits, one fails: only the failed one rolls back.
     Use a fresh `QueryClient` per test (`retry: false`, `gcTime: Infinity`) and `latencyMs: 0` (or deferred promises for control).
4. **Component (a11y/forms):** CreateUserForm and CreateTodoForm: labels, error text linked by `aria-describedby`, keyboard submit, queried via roles/labels.
5. **Route integration (apps/web):** render with `createMemoryHistory`; `/users/:id` shows loading then user; unknown id -> not found.
6. **Boundary check:** lint rule (`no-restricted-imports`) run in `pnpm lint`; optional dependency-cruiser not needed.

## Practices

- Query by role/label, never by class; no implementation-detail assertions.
- Shared `renderWithProviders` in `shared/test`.
- `turbo run test` per package; coverage not gated.

## Production outline (for README)

Add Playwright e2e for create-user -> create-todo journey, MSW if a real API appears, contract tests against the OpenAPI schema, visual/a11y checks (axe), CI running lint+typecheck+test with Turbo remote cache.
