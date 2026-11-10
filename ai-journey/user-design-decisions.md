# User Design Decisions

Decisions made by the human owner (not by the AI). Agents must follow these and raise a conflict instead of silently deviating. Source: reviews of `plan/08-requirements.md` V1 and `plan/09-test-plan.md` v2, 2026-11-08. Items marked **(to confirm, see open-questions.md)** are my interpretation of a short instruction and need your OK.

## 1. List pagination

| Decision                              | Detail                                                                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Todo list uses page-number pagination | Page number selection plus per-page (page size) selection (T-12). Server-side slicing only; the UI never receives more than one page.                                                            |
| Filter, sort and page live in the URL | `/todos?userIds=a&userIds=b&page=2&pageSize=10&sort=createdAt.desc`, validated with Zod (R-2). Reload and back/forward keep the state.                                                           |
| Filter is a multi-select of users     | A single user is just a filter with one value (G2, T-11).                                                                                                                                        |
| Default sort                          | Creation date, latest first (T-13).                                                                                                                                                              |
| No flicker between pages              | Keep previous data visible while the next page loads (`placeholderData: keepPreviousData`); show a loading status, dim the list.                                                                 |
| Stale requests are cancelled          | Pass the query `signal` to the API; only the latest request may update the UI (T-14).                                                                                                            |
| Assignee dropdown uses lazy loading   | Infinite query with "load more" / scroll; search is debounced (G3, Q2). Different mechanism from the list on purpose: a picker has no page numbers.                                              |
| Same list on user detail              | `/users/$userId` reuses the todo list with the filter locked to that user (U-9). **(to confirm, see open-questions.md)** the detail list keeps its own page/sort in search params of that route. |

## 2. Shared state

| Decision                                | Detail                                                                                                                                                                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Three kinds of state, three homes       | **Server state** -> TanStack Query only (S-2). **URL state** (filter, page, size, sort) -> TanStack Router search params. **UI state** -> Jotai. Form state stays local to the form.                                       |
| Jotai holds cross-cutting UI state only | `selectedUserIdAtom` (S-1), `themeAtom` light/dark/system (S-3), and optionally a todo status filter (T-10). Never server data.                                                                                            |
| Theme is a persisted preference         | Chosen on the user detail page, applies to the whole app, saved in `localStorage`, default follows the OS. **(to confirm, see open-questions.md)** app-wide, not per user.                                                 |
| Shared hooks                            | All query/mutation hooks live in the feature packages and are exported from their public API for reuse (A-6). Features share through `@app/shared` or through `apps/web` composition, never by importing each other (A-2). |
| Query keys managed centrally            | Key factories per feature (`userKeys`, `todoKeys`), no literal keys elsewhere (A-7, D-3).                                                                                                                                  |
| Refresh after mutations                 | After create-user, user queries are invalidated. After todo create/update/delete, todo lists are invalidated (D-1, D-2).                                                                                                   |
| Types in shared files                   | No inline types (D3 in `decisions.md`).                                                                                                                                                                                    |

## 3. Errors: popup/toast vs inline

| Situation                                    | Feedback                                                                                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Field validation (username, title, assignee) | **Inline** message under the field, linked with `aria-describedby`, field marked `aria-invalid`, focus moves to the first invalid field. No toast.                                                                       |
| Duplicate username (U-3)                     | Inline field error **and** an error toast (you asked for a popup).                                                                                                                                                       |
| Rate limited (U-7)                           | Toast plus inline hint with retry time; submit stays disabled until allowed.                                                                                                                                             |
| Create todo fails (T-6)                      | Optimistic row is rolled back; error toast **and** an inline `role="alert"` message in the form; typed values are kept for retry.                                                                                        |
| Toggle done / delete fails (T-16, T-17)      | **No optimistic update.** Row shows a pending state; on failure an error toast, row unchanged. (Your decision on G4: no optimistic update there, toast/popup on error.)                                                  |
| Load errors (list, user detail)              | Inline error state in the page area with a "Try again" button; 404 user shows a not-found page. Not a toast (the content is missing, not an action result).                                                              |
| Accessibility rule                           | A toast alone is not enough for form errors; always also expose the message in the DOM near the control. Toasts use `role="status"` (success) / `role="alert"` (failure), with enough time to read and a dismiss button. |
| Component                                    | shadcn `sonner` for toasts (add to `shared/ui`). **(to confirm, see open-questions.md)**                                                                                                                                 |

## 4. Other decisions recorded from the review

- Create-user success navigates to `/todos?userIds=<newId>` (answer 3, G8).
- Only done todos may be selected and deleted, with a confirmation (answer 4, T-17).
- Optimistic update is required **only** for creating a todo (assignment requirement), not for toggle/delete.
- Large mock dataset 1,000 users / 10,000 todos for load and pagination tests (D12).
- UI style approved from `mockup/index.html`: "UI look good for now".
