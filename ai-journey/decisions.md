# Decision Log

## D1 - Static validation first (2026-11-08)

**Decision:** Set up ESLint, Prettier, strict TypeScript and a TypeScript language server before any feature code.
**Why:** Fast, deterministic feedback loop for AI agents. Type errors, lint errors, a11y violations and illegal cross-package imports fail in seconds, so the agent self-corrects without a human, and review time goes to design instead of style.
**Tooling:** ESLint flat config (`typescript-eslint` strict, `react-hooks`, `jsx-a11y`, `@tanstack/eslint-plugin-query`, `no-restricted-imports` for package boundaries), Prettier, `tsc --noEmit` via `pnpm typecheck`, `typescript-language-server` (already installed globally, v22 Node) for editor/agent diagnostics.
**Gate:** `pnpm lint && pnpm typecheck && pnpm test` must pass before any task is called done.

## D2 - Requirements and test plan before implementation (2026-11-08)

**Decision:** Write `plan/08-requirements.md` and `plan/09-test-plan.md` first; human reviews and approves them; only then do agents implement features.
**Why:** The requirements become the contract. Every requirement has an ID and a test; agents implement against them and the human reviews the contract instead of reverse-engineering intent from code. Tests are written from the requirements (test-first where practical).

## D3 - Shared type files, no inline types (2026-11-08)

**Decision:** Types live in dedicated files (`types.ts` per package, shared domain types in `@app/shared`), not inlined in components or hooks. Prop types are named and exported from `*.types.ts` files next to the component. Styling (Tailwind class sets) is also shared through `shared/ui` primitives rather than repeated inline.
**Why:** One source of truth, easy to review, reusable in tests and across packages without importing components. See `plan/02-folder-structure.md` (types section).

## D4 - TanStack Intent skills

See `toolchain.md`.

## D5 - shadcn/ui for shared UI components (2026-11-08)

**Decision:** Use shadcn/ui (https://ui.shadcn.com/) as the component source. Components are generated into `packages/shared/src/ui/` and consumed by `apps/web`, `users` and `todos` through `@app/shared`.
**Why:**

- Speeds development with trusted, well-designed, accessible components (Radix primitives: labels, focus, keyboard, ARIA) instead of hand-rolling them.
- Built on Tailwind, so it does not violate the "styling via TailwindCSS" requirement. It is not a runtime UI library: the CLI copies source into our repo, so we own and review the code (no opaque dependency, easy to modify).
- Supports the single-shared-UI-package structure and the D3 convention (shared components and class variants, no repeated inline class strings).
  **Scope:** only the components we use: `button`, `input`, `label`, `form`/field helpers, `card`, `alert`, `badge`, `skeleton`, `separator`, `sonner` (toast, optional). No dashboards or extra blocks.
  **Trade-offs / risks:**
- Adds Radix, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` dependencies. Accepted; small and tree-shakable.
- Generated code must still pass our lint (jsx-a11y, strict TS) and the no-inline-types rule (D3). Where generated files violate it, adjust once at import time and note it.
- Monorepo wiring: shadcn CLI supports monorepos (`components.json` in `apps/web` and `packages/shared`, Tailwind v4, `@app/shared/ui` alias). Tailwind must scan `packages/shared/src` (`@source` directive).
- Reviewers can see we chose reuse deliberately and verified a11y of the output (not blind trust). AI must not hand-write what shadcn already provides.
  **Verification:** a11y tests (vitest-axe) in the test plan run against the actual composed forms.

## D6 - Tooling versions and setup fixes (2026-11-08)

Scaffold by the haiku subagent used outdated versions (pnpm 8, Vite 5, ESLint 8, Node 20, TS 5.3) and placeholder routes that did not export `Route`. Reworked by the main agent:

- Node 22 (`.nvmrc`, `engines`), pnpm 10.34.9, Vite 8, Vitest 5, TypeScript 6.0 (typescript-eslint supports `<6.1`, so not TS 7), ESLint 9 (jsx-a11y and react plugins do not yet support ESLint 10), Tailwind 4, React 19.
- ESLint config lives in `packages/config/eslint.js` (strict type-checked, a11y, react-hooks, TanStack Query, boundary rules); root `eslint.config.js` re-exports it.
- tsconfig base moved into `packages/config` (a tsconfig `extends` through a symlinked workspace package broke when the base sat at the repo root). No `baseUrl`/`paths` except inside `@app/shared`.
- File-based TanStack Router with `autoCodeSplitting`, typed `validateSearch`, router context, `routeTree.gen.ts` committed. Test files excluded from routes with `routeFileIgnorePattern`.
- shadcn: `components.json` in `apps/web` and `packages/shared`; 8 components in `packages/shared/src/ui`. The CLI `init` could not detect the framework in a package, so the theme CSS was written by hand (`packages/shared/src/styles/globals.css`). The CLI also installed a bogus npm package `cn` and imported from it; removed and replaced with `@app/shared/lib/utils`.
- `packages/shared/src/api.ts` and `index.ts` (added by the subagent beyond scope) only fixed for lint; they use `name`/`email` and do NOT match `08-requirements.md` (username, failure injection). They will be rewritten in the feature phase.
- Lesson: delegated agent overwrote `toolchain.md` and exceeded scope; always give a narrower task and diff-review afterwards.

## D7 - Install TanStack Intent skills (2026-11-08, user decision)

**Reason:** "To teach the AI what we know about the business, code base." Skills put library-specific, version-matched knowledge (and later our own project conventions) into the agent's context at the moment it edits code, instead of relying on model memory. `AGENTS.md` (generated by `intent install`) tells agents to run `pnpm exec intent list` / `intent load <package>#<skill>` before substantial work.
**Note:** The same mechanism can carry business/codebase knowledge (requirements IDs, boundary rules, query-key conventions) as local skills later.

## D8 - Requirements reviewed by human (v1) (2026-11-08)

User added T-11..T-14, A-6, A-7, N-5 and answered the four open questions (see `plan/08-requirements.md`). Test plan updated to v2 to cover them; conflicts and gaps found are listed in `plan/09-test-plan.md` section "Gaps and conflicts for review".

## D9 - HTML mockup before UI code (2026-11-08)

`ai-journey/mockup/index.html`: static, no-build mockup of the flow and style (shadcn neutral tokens, same as `globals.css`). Shows `/todos` (form, assignee combobox with load-more, multi-select filter, sort, pagination, optimistic row, rollback, delete done), `/users/new` (validation, duplicate, rate limit), `/users/$userId`, loading and 404 states. "Annotations" toggle overlays requirement IDs. Purpose: align on UX and give agents a visual target.
Note: the `/frontend-design` skill is registered at `~/.agents/skills/frontend-design`, but it is a dangling symlink to an empty folder, so it could not be loaded. The mockup applies the same principles by hand (clear hierarchy, consistent tokens, accessible states).

## D10 - frontend-design skill installed (2026-11-08)

Installed with `npx skills add https://github.com/anthropics/skills --skill frontend-design` into the project (`.agents/skills/frontend-design`, `.claude/skills`). Previous global entry was a dangling symlink. Requirements V1.1 added D-1..D-3 (data refresh after mutations). Mockup (D9) was written before the real skill was available; use the skill if the UI is revisited.

## D11 - tanstack-query skill installed (2026-11-08)

`npx skills add https://github.com/tanstack-skills/tanstack-skills --skill tanstack-query` -> `.agents/skills/tanstack-query` (community skill, not from TanStack Intent). Reason: guidance for query keys, optimistic updates, invalidation (A-7, D-1..D-3, T-5..T-9). Treat as advice: verify against installed TanStack Query v5 docs and the Intent skills; where they disagree, prefer the version-matched Intent skill and record the override in `judgment.md`.

## D12 - Performance measurement and large mock dataset (2026-11-08)

**Decision:** Measure frontend performance with repeatable, scripted checks, and run them against a large seeded in-memory dataset: **1,000 users and 10,000 todos**.
**Why:** Pagination, filtering, sorting, the assignee dropdown (lazy loading) and the optimistic cache update behave differently at scale. A small seed hides O(n) mistakes, unbounded rendering and wasteful refetching. A deterministic seed makes measurements comparable between runs and between AI-generated changes.
**What:** see `plan/05-in-memory-api.md` (dataset), `plan/09-test-plan.md` section 8 (performance plan). Budgets are set before implementation and re-checked at the end; results go into the README "Performance" reflection.
**Trade-offs:** in-memory data lives in the browser tab (about 10k small objects, a few MB at most). A real server would own pagination; here the fake API must mimic it (slice server-side, never return all rows to the UI) so the UI stays honest. Lab measurements (jsdom, Lighthouse on a dev machine) are indicative, not production truth. Documented as such.

## D13 - Review of 09 test plan and user design decisions (2026-11-08)

Human reviewed `09-test-plan.md`: accepted G2, G3, G4 (with change: toggle/delete NOT optimistic, error toast instead), G8, G10; G1, G5, G6, G7, G9 had no objection and are treated as accepted. New requirements: U-4 extended (shows user's todos), U-8 (theme preference on detail page), U-9, S-3. Created `user-design-decisions.md` (pagination, shared state, error feedback) as the owner's decisions document for agents.

## D14 - Open questions in one document (2026-11-08)

All unanswered questions and "(to confirm)" items moved to `open-questions.md` (OPEN and ANSWERED sections). Other docs link to it instead of keeping their own lists.

## D15 - Display usernames, never raw user IDs (2026-11-09)

**Decision:** Every user-facing UI location must render a user's `username`, never their raw `userId`.

**Why:** IDs are implementation details and became visible when a selected user was not in the currently loaded combobox page. A direct lookup is more reliable than assuming the option list contains the selected user.

**Implementation:** `UserCombobox` resolves its selected ID via `useUser`; the todo route title uses the selected user's username (or the neutral `selected user` loading/error fallback); in-memory todo API responses carry `assigneeUsername`, which todo rows display. Tests cover the heading and combobox behavior, and browser QA verified no raw IDs for a valid selected user.

**Rule:** IDs remain valid in URLs, API payloads, keys, and developer-facing diagnostics, but are never interpolated into visible user text.
