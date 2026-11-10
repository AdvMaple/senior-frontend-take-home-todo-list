import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import {
  Button,
  selectedUserIdAtom,
  todosSearchSchema,
  type TodoListParams,
} from "@app/shared";
import { TodosWorkspace } from "@app/todos";
import { UserCombobox, useUser } from "@app/users";

export const Route = createFileRoute("/todos")({
  validateSearch: todosSearchSchema,
  component: TodosPage,
});

function TodosPage() {
  const router = useRouter();
  const search = Route.useSearch();
  const storedUserId = useAtomValue(selectedUserIdAtom);

  // Determine effective userIds: URL takes precedence, fall back to stored selection
  const effectiveUserIds = useMemo(() => {
    if (search.userIds.length > 0) {
      return search.userIds;
    }
    return storedUserId ? [storedUserId] : [];
  }, [search.userIds, storedUserId]);

  const { data: filteredUser } = useUser(effectiveUserIds[0] ?? null);
  const filteredUserLabel =
    effectiveUserIds.length === 0
      ? null
      : (filteredUser?.username ?? "selected user");

  // Creation assignee: independent local state, initialized from effective filter user
  const [creationAssigneeId, setCreationAssigneeId] = useState<string | null>(
    () => effectiveUserIds[0] ?? null
  );

  const handleParamsChange = useCallback(
    (next: TodoListParams) => {
      void router.navigate({
        to: Route.fullPath,
        search: next,
        resetScroll: false,
      });
    },
    [router]
  );

  // Assignee for creation: independent of filter, does not update URL
  const handleCreationAssigneeChange = useCallback((userId: string | null) => {
    setCreationAssigneeId(userId);
  }, []);

  // Filter by user: updates URL and resets page
  const handleFilterUserChange = useCallback(
    (userId: string | null) => {
      const newUserIds = userId ? [userId] : [];
      handleParamsChange({ ...search, userIds: newUserIds, page: 1 });
    },
    [search, handleParamsChange]
  );

  // Clear user filter: sets userIds to [] and resets page
  const handleClearUserFilter = useCallback(() => {
    handleParamsChange({ ...search, userIds: [], page: 1 });
  }, [search, handleParamsChange]);

  const assigneePicker = (
    <UserCombobox
      value={creationAssigneeId}
      onValueChange={handleCreationAssigneeChange}
      label="Create as user"
      placeholder="Select user"
      searchPlaceholder="Search users..."
      id="assignee-picker"
    />
  );

  // Build filter slot: separate from creation assignee
  const filterSlot = (
    <div className="flex flex-col gap-2">
      <label htmlFor="filter-user-combobox" className="text-sm font-medium">
        Filter todos by user
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <UserCombobox
          value={search.userIds[0] ?? null}
          onValueChange={handleFilterUserChange}
          placeholder="Select user"
          searchPlaceholder="Search users..."
          className="min-w-0 flex-1"
          id="filter-user-combobox"
        />
        {search.userIds.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={handleClearUserFilter}
            aria-label="Clear user filter"
          >
            Clear filter
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Todos
          {filteredUserLabel !== null && ` for ${filteredUserLabel}`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your todos and stay organized.
        </p>
      </div>
      <TodosWorkspace
        params={{ ...search, userIds: effectiveUserIds }}
        onParamsChange={handleParamsChange}
        assigneeId={creationAssigneeId}
        onAssigneeIdChange={handleCreationAssigneeChange}
        assigneePicker={assigneePicker}
        filterSlot={filterSlot}
        renderAssignee={(item) => (
          <Link
            to="/users/$userId"
            params={{ userId: item.assigneeId }}
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {item.assigneeUsername ?? "Unknown user"}
          </Link>
        )}
      />
    </div>
  );
}
