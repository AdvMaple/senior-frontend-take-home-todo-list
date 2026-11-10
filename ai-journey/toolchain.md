# AI Toolchain

Started: 2026-11-08 16:47 (UTC+7). This is the final, curated record of tools used for this take-home.

| Tool / model                                               | How it was used                                                                                                                                                                                                            |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **pi coding agent**                                        | Primary planning and coding harness. Used for file inspection, focused edits, task tracking, quality commands, and the final curated session export.                                                                       |
| **Main model: `gpt-5.6-terra` via `hai-proxy-openai`**     | Helped translate reviewed requirements into implementation steps, reason about code, propose tests, and interpret validation results. Human review directed scope and accepted changes.                                    |
| **Subagent `worker` on `github-copilot/claude-haiku-4.5`** | Used early for a bounded project-scaffold task. Its output was reviewed and corrected rather than accepted blindly; details are in `judgment.md`.                                                                          |
| **TanStack Intent skills**                                 | Consulted for version-matched TanStack Router guidance: typed search parameters, route structure, and navigation behavior. Registry: <https://tanstack.com/intent/registry/%40tanstack__router-core>.                      |
| **`tanstack-query` skill**                                 | Consulted for query-key, invalidation, and optimistic-update patterns. Community guidance was checked against the installed TanStack Query v5 behavior.                                                                    |
| **`frontend-design` skill**                                | Used as an input to the static flow/style mockup and UI review. The resulting mockup is committed at `mockup/index.html`.                                                                                                  |
| **Chrome DevTools MCP server**                             | Used for manual browser QA: responsive layout, theme behavior, pagination placement/scroll retention, long-title truncation, and final username rendering. It found the missing Tailwind source scan for feature packages. |
| **ESLint, Prettier, TypeScript, Vitest, Testing Library**  | Deterministic code-quality and regression checks. These were run by the agent, then reviewed as final gates.                                                                                                               |
| **Vite, Tailwind CSS, shadcn/ui source components**        | Application build/styling toolchain. shadcn-style component source is owned in `packages/shared/src/ui`, not used as an opaque runtime UI library.                                                                         |

## Installed project baseline

- Node `>=22`, pnpm `10.34.9`, Turborepo `2.11.10`
- React `19.3.1`, TypeScript `~6.0.0`, Vite `8.3.6`, Tailwind `4.3.5`
- TanStack Router `1.170.46`, TanStack Query `5.107.1`, Jotai `3.0.1`, Zod `4.6.7`
- Vitest `5.1.0`, Testing Library, `vitest-axe`, ESLint `9.39.0`, Prettier `3.9.10`

## How AI output was controlled

- Requirements and the test plan were reviewed before feature implementation.
- The agent worked within package boundaries and used shared types rather than creating ad hoc local models.
- Changes were checked with linting, strict type checking, targeted regression tests, full tests, and a production build.
- Browser observations were treated as evidence, not assumptions. Manual findings and corrections are recorded in `manual-test-findings.md` and `judgment.md`.
- No credentials, private data, or production systems were used. The app uses only its local in-memory fake API.

## Session artifact

`session/session.jsonl` and `session/session.html` are a redacted, curated export of the useful user/assistant discussion. They intentionally omit hidden instructions, tool arguments/results, reasoning, and sensitive local paths. `prompts.md` is the shorter reviewer-oriented record of the significant human prompts.
