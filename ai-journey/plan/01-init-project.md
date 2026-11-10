# 01 - Init Project

Work in a fresh repo created from the template (do not PR against the assignment repo).
Project root = `senior-frontend-engineer/` content of the new repo (or repo root).

## Steps

1. `pnpm dlx create-turbo@latest` (empty template) or hand-write; set `packageManager` in root `package.json`.
2. `pnpm-workspace.yaml`: `apps/*`, `packages/*`.
3. Create workspaces: `apps/web` (Vite react-ts), `packages/{users,todos,shared}`, `packages/config` (tsconfig/eslint presets).
4. Package names: `@app/web`, `@app/users`, `@app/todos`, `@app/shared`, `@app/config`.
5. Feature packages are source-only (`"exports": "./src/index.ts"`, no build step); Vite compiles them. Keeps it simple.
6. Root `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, bundler resolution); each package extends it.
7. Install deps: react, react-dom, @tanstack/react-router, @tanstack/router-plugin, @tanstack/react-query, @tanstack/react-query-devtools, jotai, zod, tailwindcss, @tailwindcss/vite. Dev: vitest, jsdom, @testing-library/*, eslint stack, prettier, typescript.
8. `turbo.json` tasks: `dev` (persistent, no cache), `build`, `lint`, `typecheck`, `test`.
9. Root scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `format`.
10. Boundary enforcement: ESLint `no-restricted-imports` in `packages/users` forbidding `@app/todos`, and vice versa. Also do not list the sibling in `package.json`.
11. `.gitignore`, `.editorconfig`, `.nvmrc` (Node LTS).
12. First commit: "chore: scaffold turborepo". Verify `pnpm dev` shows a blank page, `pnpm build` passes.

## Done when

`pnpm install && pnpm dev|build|lint|typecheck|test` all run green on an empty app.

## TanStack Intent skills (added 2026-11-08)

13. After step 7 (deps installed), from the repo root:
    - `npx @tanstack/intent@latest list` - confirm `@tanstack/router-core` (and other TanStack packages) expose skills. Skills are shipped inside the npm packages; registry page: https://tanstack.com/intent/registry/%40tanstack__router-core
    - `npx @tanstack/intent@latest install` - writes skill-loading guidance into the agent config file (e.g. `AGENTS.md`); review the diff before committing.
    - Optional: `npx @tanstack/intent@latest hooks` to surface/enforce skill loading.
    - If router-core shows no skills, check the `@tanstack/react-router` / `@tanstack/router-plugin` packages instead, and note it.
14. Record the result in `ai-journey/toolchain.md` (commands run, files changed, skills loaded) and mention in `judgment.md` where a skill changed the output.

## shadcn/ui setup (decision D5)

15. After Tailwind v4 works in `apps/web`: initialise shadcn for the monorepo (`pnpm dlx shadcn@latest init`, monorepo mode; see https://ui.shadcn.com/docs/installation and the monorepo docs). Components target `packages/shared/src/ui`; `components.json` in both `apps/web` and `packages/shared` with aliases pointing at `@app/shared`.
16. Add only the needed components: `pnpm dlx shadcn@latest add button input label card alert badge skeleton separator` (add `form`/field helper as needed).
17. Add `@source "../../packages/shared/src"` (path adjusted) in the app's Tailwind CSS so classes in shared are generated.
18. Export components from `packages/shared/src/ui/index.ts` (public API only). Run lint/typecheck; fix generated code violations once and record in `decisions.md`.
19. Do not add the shadcn components to feature packages; features import from `@app/shared`.
