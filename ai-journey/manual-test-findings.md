# Manual Test Findings

## 2026-11-09: Long todo title

| Scenario                                                            | Result | Evidence                                                                                                                                                                               |
| ------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A rendered todo title containing 120 characters at a 500px viewport | Pass   | Browser check: title content width was 930px while its available width was 362px; `overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap`; document width remained 500px. |

The browser check temporarily substituted a rendered row title with 120 characters to verify the real compiled CSS. Automated coverage in `packages/todos/src/components/todo-list.test.tsx` verifies the required truncation and flex constraints. Visual clipping is recorded here because jsdom cannot calculate rendered text width or CSS ellipsis.
