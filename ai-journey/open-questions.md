# Open Questions

Single place for questions that need the owner's decision. Other documents link here instead of holding their own lists. Status: **OPEN** needs an answer, **ANSWERED** decided (kept for history). Fill in the "Answer" column; I will apply answers to the plan files.

## A. Open (need your decision)

| #    | Question                                                                                                                     | Context / source                                | My default if you do not answer                           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| Q-1  | Is the theme (light/dark/system) an **app-wide** preference, or **stored per user** (each user record has its own theme)?    | U-8, S-3, `user-design-decisions.md` section 2  | App-wide, saved in `localStorage`                         |
| Q-2  | On the user detail page, does the user's todo list keep **its own** page / page size / sort in the route's search params?    | U-9, `user-design-decisions.md` section 1       | Yes, search params on `/users/$userId`                    |
| Q-3  | Use shadcn **`sonner`** for toasts?                                                                                          | N-8, `user-design-decisions.md` section 3       | Yes                                                       |
| Q-4  | Where does the in-memory backend live: `packages/shared/src/api` or a separate `packages/mock-api`?                          | `plan/02-folder-structure.md` ("Open decision") | `shared/api` (fewer packages)                             |
| Q-5  | Confirm the **performance budgets** (bundle, LCP, TBT, INP, DOM nodes, cache bounds)                                         | `plan/09-test-plan.md` section 8.2              | Use proposed numbers                                      |
| Q-6  | Rate limit values for user creation: 3 per 10 s OK? Client throttle interval?                                                | U-7                                             | 3 per 10 s, client throttle 1 s                           |
| Q-7  | Priority of T-10 (todo status filter in Jotai): Should or drop? Now that `selectedUserId` and theme already use Jotai        | T-10, S-1, S-3                                  | Keep as Should, implement last                            |
| Q-8  | Is **bulk** delete (select many done todos) required, or one at a time?                                                      | T-17                                            | Bulk with confirm dialog                                  |
| Q-9  | Gaps G1, G5, G6, G7, G9 from the test review had no comment. Confirm they are accepted as proposed                           | `plan/09-test-plan.md` section 0                | Treated as accepted                                       |
| Q-10 | Subagent use: should implementation be done by cheaper models (haiku) again, given the scope overreach in the scaffold step? | `decisions.md` D6                               | Narrow, single-package tasks only, diff review after each |
| Q-11 | Model name used for this work, for `toolchain.md` (not detectable by the agent)                                              | `toolchain.md`                                  | left blank                                                |

## B. Answered (history)

From `plan/08-requirements.md` "Open questions for reviewer" (V1):

| #   | Question                                           | Answer                                                                                                            |
| --- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| H-1 | Duplicate usernames: case-insensitive conflict OK? | Show an error popup in the username form; also rate-limit the API/form to prevent repeated attempts (-> U-3, U-7) |
| H-2 | Assignee: free-text user ID or dropdown?           | Dropdown with pagination / lazy loading, users loaded from the API (-> Q2 in tests, G3)                           |
| H-3 | After create-user: navigate to user page or stay?  | Navigate to the main todo page `/todos` (-> G8)                                                                   |
| H-4 | Todo "done" toggle: skip?                          | When a todo is done, allow selecting it and deleting it (-> T-16, T-17)                                           |

From `plan/09-test-plan.md` section 0 (gaps):

| #   | Decision                                                                                       |
| --- | ---------------------------------------------------------------------------------------------- |
| G2  | Accepted: one selected user is a filter; search param becomes `userIds` array; wording updated |
| G3  | Accepted: list = page numbers; dropdown = infinite/lazy loading                                |
| G4  | Accepted **with change**: toggle and delete are not optimistic; show an error toast on failure |
| G8  | Accepted: navigate to `/todos?userIds=<id>`                                                    |
| G10 | Accepted: hooks exported from feature packages, central key factories, no literal keys         |

Other: UI style approved from `mockup/index.html` ("UI look good for now").
