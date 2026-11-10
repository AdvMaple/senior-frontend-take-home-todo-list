# 04 - TanStack Best Practices (Router + Query)

## Router

- File-based routing with `@tanstack/router-plugin` (Vite), `autoCodeSplitting: true`.
- Routes: `/` (redirect to `/todos`), `/users/new`, `/users/$userId`, `/todos` (search param `userId?`).
- Typed params and search: `validateSearch` with Zod (`userId` optional); use `Route.useParams()`/`useSearch()`; navigate with typed `<Link to=... params=...>` / `useNavigate`.
- Router context carries `queryClient`; route `loader` calls `queryClient.ensureQueryData(userQueryOptions(id))` to prefetch (no waterfalls). Component then reads with `useSuspenseQuery` using the same options.
- `pendingComponent`, `errorComponent`, `notFoundComponent` on root and user-detail routes (404 user -> notFound).
- `defaultPreload: 'intent'` for links.
- Router created once outside render; `Register` interface declared for type safety.

## Query

- One `QueryClient` from `shared/query/createQueryClient` (sane defaults: `staleTime` 30s, `retry` 1 for queries, 0 for mutations, no refetch on window focus noise).
- **Query key factories** per feature: `userKeys.detail(id)`, `todoKeys.byUser(userId)`; keys hierarchical for targeted invalidation.
- Use `queryOptions()` factories, shared by loaders, hooks, and tests.
- Hooks wrap options: `useUser(id)`, `useUserTodos(userId)`; components never call fetchers directly.
- `select` to derive/filter (todo filter from Jotai applied in `select` or render, not stored in the cache).
- `enabled` only where the id may be absent.
- Query functions throw typed `ApiError`; handled by `errorComponent` / inline error UI with retry.
- Install `@tanstack/eslint-plugin-query`; devtools in dev only.

## Optimistic create ToDoItem (key requirement)

Implement `useCreateTodo` with the cache-based approach:

1. `onMutate(newTodo)`: `await queryClient.cancelQueries({ queryKey: todoKeys.byUser(assigneeId) })`; snapshot `previous = getQueryData(...)`; `setQueryData` appending an item with temp id (`optimistic-<uuid>`) and `pending: true`; return `{ previous, tempId }`.
2. `onError(err, vars, ctx)`: restore `ctx.previous` for that user's key; surface error message (inline `role="alert"`), keep form values so the user can retry.
3. `onSettled`: `invalidateQueries({ queryKey: todoKeys.byUser(assigneeId) })` to reconcile with server (replaces temp id with real id).

- Key is per assignee, so switching user mid-flight never corrupts another list.
- Overlapping submits: each mutation snapshots/rolls back via its own context; invalidate only when `isMutating(todoKeys.create) === 1` to avoid flicker.
- Optimistic items render with muted style and `aria-busy`.
- Alternative (`useMutationState` variables-based UI) noted in README as a trade-off; cache approach chosen because list lives in several places.

## Jotai (deliberate use)

- `selectedUserIdAtom` (which user's todos are shown on `/todos`; synced with search param) and `todoStatusFilterAtom` (all/pending). Atoms live in `shared/state`.
- Do not store server data in Jotai.
