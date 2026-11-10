import { cn, type PageSize } from "@app/shared";
import { useCallback } from "react";
import type { TodoListItem } from "../todo.types";
import { useTodos } from "../hooks/useTodos";
import { useToggleTodo } from "../hooks/useToggleTodo";
import { useDeleteTodos } from "../hooks/useDeleteTodos";
import { TodoList } from "./todo-list";
import { TodoListControls, TodoListPagination } from "./todo-list-controls";
import { CreateTodoForm } from "./create-todo-form";
import type { TodosWorkspaceProps } from "./todos-workspace.types";

/**
 * TodosWorkspace: composed todo management interface.
 * - Queries todos with controlled params
 * - Toggles todos non-optimistically
 * - Deletes completed todos individually with confirmation
 * - Includes create form with retained query parameters
 */
export function TodosWorkspace({
  params,
  onParamsChange,
  assigneeId,
  onAssigneeIdChange,
  assigneePicker,
  filterSlot,
  renderAssignee,
  className,
}: TodosWorkspaceProps) {
  const { items, total, isPending, isFetching, isError, error, refetch } =
    useTodos(params);
  const { toggleTodo, isPending: togglePending } = useToggleTodo();
  const { deleteTodos, isPending: deletePending } = useDeleteTodos();

  /**
   * Handler for toggling a todo's done state.
   * Non-optimistic: waits for server confirmation.
   */
  const handleToggleDone = useCallback(
    (item: TodoListItem) => {
      toggleTodo({
        id: item.id,
        done: item.done,
      }).catch(() => {
        // Error handled by hook (notify.error)
      });
    },
    [toggleTodo]
  );

  /**
   * Handler for deleting one completed todo. The API enforces the same rule,
   * while this guard prevents an unnecessary confirmation for an incomplete row.
   */
  const handleDelete = useCallback(
    (item: TodoListItem) => {
      if (!item.done) {
        return;
      }

      const confirmed = window.confirm(
        `Delete completed todo "${item.title}"?`
      );
      if (!confirmed) {
        return;
      }

      void deleteTodos([item.id]).catch(() => {
        // Error handled by hook (notify.error)
      });
    },
    [deleteTodos]
  );

  /**
   * Handlers for TodoListControls that call onParamsChange
   * while preserving other params.
   */
  const handlePageChange = useCallback(
    (page: number) => {
      onParamsChange({ ...params, page });
    },
    [params, onParamsChange]
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      onParamsChange({ ...params, pageSize, page: 1 });
    },
    [params, onParamsChange]
  );

  const handleSortChange = useCallback(
    (sort: string) => {
      onParamsChange({ ...params, sort: sort as typeof params.sort, page: 1 });
    },
    [params, onParamsChange]
  );

  /**
   * Handler for successful CreateTodoForm submission.
   * Retains current query parameters.
   */
  const handleTodoCreated = useCallback(() => {
    // Query parameters are retained automatically by not modifying them
  }, []);

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Create form */}
      <CreateTodoForm
        assigneeId={assigneeId}
        onAssigneeIdChange={onAssigneeIdChange}
        assigneePicker={assigneePicker}
        onCreated={handleTodoCreated}
      />

      {/* List controls */}
      <TodoListControls
        page={params.page}
        pageSize={params.pageSize as PageSize}
        sort={params.sort}
        total={total}
        isFetching={isFetching}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSortChange={handleSortChange}
        filterSlot={filterSlot}
        showPagination={false}
      />

      {/* Loading state */}
      {isPending && (
        <div className="flex justify-center py-8">
          <p className="text-sm text-muted-foreground">Loading todos…</p>
        </div>
      )}

      {/* Error state with retry */}
      {isError && !isPending && (
        <div
          role="alert"
          className="rounded-lg border border-destructive bg-destructive/10 p-4"
        >
          <p className="text-sm text-destructive font-medium">
            {error instanceof Error
              ? error.message
              : "Failed to load todos. Please try again."}
          </p>
          <button
            onClick={() => {
              void refetch();
            }}
            className="mt-2 text-sm underline text-destructive hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Todo list */}
      {!isPending && (
        <>
          <TodoList
            items={items}
            onToggleDone={handleToggleDone}
            onDelete={handleDelete}
            togglePending={togglePending}
            deletePending={deletePending}
            emptyMessage="No todos"
            {...(renderAssignee ? { renderAssignee } : {})}
          />
          <TodoListPagination
            page={params.page}
            pageSize={params.pageSize as PageSize}
            total={total}
            isFetching={isFetching}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </div>
  );
}
