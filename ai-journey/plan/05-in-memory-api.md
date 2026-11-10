# 05 - In-Memory API

Per recommendation: no MSW/json-server; a typed in-memory backend behind an interface.

## Design

- `ApiClient` interface in `shared/api`:
  - `createUser({ username }) -> User` (rejects duplicate username with `ApiError('CONFLICT')`)
  - `getUser(id) -> User` (`ApiError('NOT_FOUND')`)
  - `createTodo({ title, assigneeId }) -> Todo` (assignee must exist, else `NOT_FOUND`/`VALIDATION`)
  - `listTodosByUser(userId) -> Todo[]`
- `createInMemoryApi({ latencyMs, failureRate, seed, failNext })` returns an `ApiClient`:
  - `Map` stores, ids via `crypto.randomUUID()`, returns copies (no shared mutable references).
  - Simulated latency (default 300-600ms) so optimistic UI is visible; `latencyMs: 0` in tests.
  - Failure injection: `failNext(op)` hook for deterministic rollback tests; a dev toggle (query param `?fail=todos`) for manual demo.
  - Seed: 2 users, a few todos.
- `ApiClient` provided through a small React context/`getApi()` module in shared; the feature `api/` modules call it. Tests inject a fresh instance per test.
- Zod schemas validate input at the API boundary too (mirrors a real server's validation).
- Persistence: memory only (reset on reload); optional `localStorage` flag out of scope.

## Types

`User { id: UserId; username: string; createdAt }`, `Todo { id: TodoId; title; assigneeId: UserId; createdAt }`; the `ApiError` class has `code` and `message`.

## README note

Swapping to a real HTTP backend only means a new `ApiClient` implementation (e.g. fetch-based); features are unchanged.

## Large dataset profile (decision D12)

- `seed({ users: 1000, todos: 10000, seed: 42 })`: deterministic PRNG (e.g. mulberry32), no `Math.random()`. Same data every run.
- Distribution: todos spread across users with skew (a few "heavy" users with 200+ todos, most with under 10, some with 0) to test empty states and filters. About 30% done. `createdAt` spread over 2 years, with deliberate ties for stable-sort tests. Usernames unique and realistic (`firstname.lastnameNN`).
- Profiles: `small` (2 users, 6 todos; default for unit tests), `demo` (25 users, 120 todos), `load` (1,000 / 10,000). Selected by `createInMemoryApi({ profile })`, URL flag `?dataset=load` in the dev build, or env `VITE_DATASET`.
- Indexes in the fake backend (Map by id, `Map<userId, Todo[]>`, pre-sorted by `createdAt` desc) so API latency is not dominated by the fake itself. Server-side semantics: filtering, sorting and slicing happen in the API; the UI never receives more than one page. The API reports its own processing time separately from the simulated network latency (latency setting stays configurable: 0 in tests, 300-600 ms in demo, selectable `slow` 2 s to expose loading states).
- Generation must be fast (under 200 ms) and lazy (generated on first use, off the critical render path), and is itself covered by a test.
