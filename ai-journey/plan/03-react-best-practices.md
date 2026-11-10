# 03 - React Best Practices

## Components

- Function components only; small, single-purpose. Presentational components receive data via props; hooks own logic.
- Container/hook split: `useCreateTodo` (logic) + `CreateTodoForm` (presentation).
- Derive state during render; no `useEffect` for derived data or for fetching. Effects only for external sync.
- No premature `useMemo`/`useCallback`/`memo`. Add only where profiling or referential stability requires it (React Compiler optional, noted in README).
- Stable `key`s (ids, never index). Lists render item components.
- Colocate state; lift only when needed. Cross-cutting state in Jotai, server state in Query, form state local.
- Explicit prop types, no `any`; discriminated unions for status; branded ids (`UserId`, `TodoId`).
- Error Boundary at route level (router `errorComponent`); `Suspense` where `useSuspenseQuery` is used.
- Code-split by route (router `autoCodeSplitting: true`).

## Forms and accessibility

- Native `<form onSubmit>`, `<label htmlFor>`, `aria-invalid`, `aria-describedby` linking to error text, `role="alert"` for submit errors.
- Focus first invalid field after failed validation; submit button disabled only while pending (with `aria-busy`).
- Semantic landmarks (`header/nav/main`), headings in order, visible focus ring (Tailwind `focus-visible`), skip link.
- Lists use `<ul>/<li>`; loading uses `role="status"`.
- Validation: Zod schemas, per-package, run on submit (and on blur after first touch). Messages human-readable ("Username must be 3-20 characters").

## Styling

- Tailwind utility classes; UI built from shadcn/ui components in `shared/ui` (D5), no hand-rolled primitives. No custom CSS beyond the Tailwind import and shadcn theme variables.

## Quality gates

- ESLint: `react-hooks`, `jsx-a11y`, `@typescript-eslint` strict. `typecheck` in CI-less local script.
