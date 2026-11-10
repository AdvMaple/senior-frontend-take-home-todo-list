# 02 - Folder Structure

```text
.
├── ai-journey/                 # plan/, prompts.md, toolchain.md, judgment.md, session/
├── apps/
│   └── web/
│       ├── index.html
│       ├── vite.config.ts      # react, tailwind, tanstackRouter plugins
│       └── src/
│           ├── main.tsx        # providers: QueryClientProvider, Jotai Provider, RouterProvider
│           ├── router.tsx      # createRouter({ routeTree, context: { queryClient } })
│           ├── routeTree.gen.ts (generated)
│           ├── routes/
│           │   ├── __root.tsx          # layout, nav, error/notFound
│           │   ├── index.tsx           # redirect or home
│           │   ├── users.new.tsx       # create user
│           │   ├── users.$userId.tsx   # user detail + that user's todos (composition)
│           │   └── todos.tsx           # create todo + list, ?userId= search param
│           ├── composition/    # glue that joins users + todos (e.g. UserTodosPanel)
│           └── styles.css      # @import "tailwindcss"
├── packages/
│   ├── users/
│   │   └── src/
│   │       ├── index.ts        # public API only
│   │       ├── api/            # usersApi.ts (uses ApiClient from shared)
│   │       ├── queries/        # queryOptions factories, keys
│   │       ├── hooks/          # useUser, useCreateUser
│   │       ├── components/     # CreateUserForm, UserDetail
│   │       ├── schemas.ts      # zod
│   │       └── types.ts
│   ├── todos/
│   │   └── src/                # same layout: api/, queries/, hooks/, components/, schemas.ts, types.ts
│   │       └── hooks/useCreateTodo.ts   # optimistic mutation
│   ├── shared/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── api/            # ApiClient interface, ApiError, in-memory implementation, seed
│   │       ├── query/          # createQueryClient, defaults
│   │       ├── state/          # Jotai atoms: selectedUserIdAtom, todoFilterAtom
│   │       ├── ui/             # Button, TextField, ErrorMessage, Spinner (a11y primitives)
│   │       ├── types/          # UserId, TodoId branded types, shared DTOs
│   │       └── test/           # render helpers, test QueryClient
│   └── config/                 # tsconfig.*.json, eslint preset
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── README.md                   # architecture, run, reflections
```

## Boundary rules

- `apps/web` -> may import users, todos, shared.
- `users`, `todos` -> may import shared only. Never each other.
- `shared` -> imports nothing from the other workspaces.
- Each package exposes only `src/index.ts`; no deep imports (use `exports` field).
- Cross-feature needs go through `apps/web`: it reads a `userId` from the route, passes it as a prop. Todos only know a `userId: UserId` string (branded type lives in shared), never the User entity.
- The user-existence check when assigning a todo is done by the API (shared in-memory backend), not by importing the users package.

## Open decision

Where the in-memory backend lives: `shared/api` (default; both features use it) vs a `packages/mock-api`. Default: `shared/api`, to keep the package count low.

## Types and shared styles convention (decision D3)

- No inline types or inline prop-type literals. Every type is a named export in a types file.
- Domain types: `shared/src/types/` (`ids.ts` branded `UserId`/`TodoId`, `user.ts`, `todo.ts`, `api.ts` for `ApiClient`/`ApiError` codes, `result.ts`). Feature packages re-export what they own via `src/types.ts`; features import shared types from `@app/shared`.
- Component props: `ComponentName.types.ts` beside `ComponentName.tsx` (e.g. `CreateTodoForm.types.ts`).
- Hook option/return types: `hooks/*.types.ts` or the package `types.ts`.
- Zod: schemas in `schemas.ts`; input types derived with `z.infer`, exported from `types.ts` (not re-declared).
- Query keys and query option types live in `queries/`.
- Tailwind class sets reused in more than one place become variants in `shared/ui` (e.g. `Button`, `TextField`), not repeated strings.
- ESLint rule to support it: `@typescript-eslint/consistent-type-definitions` (interface/type) and `consistent-type-imports`. Inline object type literals in props are reviewed manually.

## UI components (decision D5)

`shared/src/ui/` holds shadcn/ui generated components (`button.tsx`, `input.tsx`, `label.tsx`, `card.tsx`, `alert.tsx`, `badge.tsx`, `skeleton.tsx`, ...) plus `cn()` helper in `shared/src/lib/utils.ts`. Thin app-level wrappers (e.g. `TextField` = Label + Input + error text with correct `aria-*`) also live in `shared/src/ui/`. Feature packages and the app compose these; they do not define raw styled primitives.
