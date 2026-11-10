# 07 - Include the Current Session, README, Finish

## ai-journey contents

```text
ai-journey/
├── plan/              # these files, as-is
├── prompts.md         # curated key prompts
├── toolchain.md       # tools, models, skills, MCP servers and purpose
├── judgment.md        # where AI helped/was wrong/overridden
└── session/
    ├── session.jsonl  # redacted, text-only pi session
    └── session.html   # rendered transcript
```

## Steps

1. At start of implementation, note current session file: `ls -t ~/.pi/agent/sessions/--Users-I756091-IdeaProjects-personal-projects-take-home-tasks--/ | head -1` (path form may vary; check `docs/session-format.md`).
2. After finishing, export the session:
   - In pi: `/export ai-journey/session/session.html` (and `.jsonl` if offered), or
   - CLI: `pi --export <session.jsonl> ai-journey/session/session.html`
   - Copy a redacted `.jsonl` into `ai-journey/session/`; do not include system, tool-result, thinking, or tool-call records.
3. Review the export for secrets (tokens, internal SAP URLs, emails) and redact before committing. The skills/MCP system prompt may contain internal info; check the HTML.
4. Write `prompts.md` (5-10 key prompts with intent), `toolchain.md` (pi, model name, skills used e.g. asd-ste100 / UI5 not used, MCP: chrome-devtools if used, codegraph, pi-lens), `judgment.md` (examples: where AI suggested wrong query key / effect-based fetching and how it was corrected, verified by tests).
5. Keep `ai-journey/plan/` in sync: mark steps done, add deviations.

## Final README (about half a page + extras)

- Install/run: `pnpm install`, `pnpm dev`, `pnpm test`, `pnpm lint`, `pnpm build`.
- Architecture: why split by feature packages + shared + app; boundary rules; how todos and users compose in `apps/web`.
- Trade-offs: in-memory API, source-only packages (no per-package build), Zod, cache-based optimistic update.
- Reflections: **Performance** (route code-splitting, query `staleTime`, per-user keys, selector-based Jotai atoms, preload on intent) and **Testing strategy** (from 06).
- Link to `ai-journey/`.

## Final checklist

- [x] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass (193 tests passing: 93 shared, 23 users, 51 todos, 26 web; final run 2026-11-09)
- [x] Manual browser QA: pagination placement and scroll retention, sort, page size, theme/responsive layout, 120-character truncation, and user-name rendering are recorded in `../manual-test-findings.md` and `../judgment.md`
- [ ] Keyboard-only manual pass through both forms (not recorded; component keyboard tests pass)
- [x] No sibling feature imports (`rg "@app/todos" packages/users`, and inverse)
- [x] Session exported and redacted (text-only JSONL + rendered HTML)
- [x] Fill End time in `00-overview-and-timing.md` (2026-11-08 23:57 UTC+7)
- [ ] Commit, push to own repo (not requested for this task)
