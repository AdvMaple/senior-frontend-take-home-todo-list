# Plan Overview and Timing

## Time tracking

- **Start:** 2026-11-08 16:47 (UTC+7)
- **End:** 2026-11-08 23:57 (UTC+7)
- **Time box:** 2-4 hours, so target finish between 18:47 and 20:47.
- Update the End line in the last step of `07-session-capture.md`. **Completed:** 2026-11-08 23:57 (UTC+7).

## Goal

Build the JTL senior frontend take-home (`../../instructions.md`): users + todos, Turborepo,
React/TS/Vite, TanStack Router + Query, Jotai, Tailwind, in-memory API, optimistic todo create with rollback.

## Technologies

| Concern         | Choice                                                                                  | Why                                                                     |
| --------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Monorepo        | Turborepo + pnpm workspaces                                                             | Required; pnpm gives strict deps, so illegal cross-package imports fail |
| Build/dev       | Vite + React 19 + TypeScript (strict)                                                   | Required                                                                |
| Routing         | TanStack Router (file-based, code-split)                                                | Required; type-safe params and search                                   |
| Server state    | TanStack Query v5                                                                       | Required; caching + optimistic mutations                                |
| UI state        | Jotai                                                                                   | Required; selected user id, todo filter                                 |
| Styling         | TailwindCSS v4                                                                          | Required                                                                |
| UI components   | shadcn/ui (copied into `shared/ui`, Radix + Tailwind)                                   | Trusted accessible components, Tailwind-based so rule-compliant (D5)    |
| Validation      | Zod                                                                                     | Shared schemas for form and API boundary; small                         |
| API             | In-memory fake API (typed `ApiClient`, latency + failure injection)                     | Recommended; no network, deterministic tests                            |
| Tests           | Vitest + Testing Library + user-event                                                   | Vite native                                                             |
| Static analysis | ESLint + Prettier + tsc + typescript-language-server (decision D1 in `../decisions.md`) | Fast validation loop for AI                                             |
| Agent skills    | TanStack Intent (`@tanstack/router-core` skills)                                        | Version-matched guidance; see 01 step 13                                |
| Lint/format     | ESLint (flat) + eslint-plugin-jsx-a11y + `@tanstack/eslint-plugin-query` + Prettier     | Enforce practices                                                       |

## Plan files

0. Requirements and test plan come BEFORE features: `08-requirements.md`, `09-test-plan.md` (human review gate)
1. `01-init-project.md` - scaffold, tooling, scripts
2. `02-folder-structure.md` - packages, boundaries, files
3. `03-react-best-practices.md`
4. `04-tanstack-best-practices.md` - Router + Query
5. `05-in-memory-api.md`
6. `06-testing.md`
7. `07-session-capture.md` - ai-journey, export of this session, final README

## Execution order (COMPLETED)

01 -> 02 -> 05 -> 04/03 (feature work) -> 06 -> 07. All phases completed.
Milestone order of value: boundaries ✓, optimistic create + rollback ✓, routing ✓, polish ✓.
