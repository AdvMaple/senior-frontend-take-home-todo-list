import { Button, cn } from "@app/shared";
import type { ReactElement } from "react";
import type { TodoListItem } from "../todo.types";
import type { TodoListProps } from "./todo-list.types";

/**
 * Presentational TodoList component with done toggling and per-item deletion.
 * Renders loading/pending states visibly, no API calls or hooks.
 */
export function TodoList({
  items,
  onToggleDone,
  onDelete,
  togglePending = false,
  deletePending = false,
  emptyMessage = "No todos",
  renderAssignee,
  className,
}: TodoListProps): ReactElement {
  const handleToggleDone = (item: TodoListItem) => {
    onToggleDone({ ...item, done: !item.done });
  };

  const handleDelete = (item: TodoListItem) => {
    onDelete(item);
  };

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed px-4 py-8",
          className
        )}
        role="status"
        aria-label="Empty todos list"
      >
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
            item.isPending && "opacity-60",
            item.done && "bg-muted"
          )}
          {...(item.isPending && { "aria-busy": true })}
          data-testid={`todo-row-${item.id}`}
        >
          <input
            type="checkbox"
            id={`done-${item.id}`}
            checked={item.done}
            onChange={() => {
              handleToggleDone(item);
            }}
            disabled={togglePending || item.isPending}
            aria-label={`Mark as ${item.done ? "not done" : "done"}: ${item.title}`}
            className="h-4 w-4 shrink-0 rounded border-input"
          />

          <div className="min-w-0 flex-1">
            <label
              htmlFor={`done-${item.id}`}
              className={cn(
                "block cursor-pointer truncate text-sm font-medium",
                item.done && "line-through text-muted-foreground"
              )}
            >
              {item.title}
            </label>
            <p className="truncate text-xs text-muted-foreground">
              Assignee:{" "}
              {renderAssignee?.(item) ??
                item.assigneeUsername ??
                "Unknown user"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {item.isPending && (
              <span className="text-xs text-muted-foreground">Saving…</span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                handleDelete(item);
              }}
              disabled={!item.done || item.isPending || deletePending}
              aria-label={`Delete todo: ${item.title}`}
              title={
                item.done
                  ? `Delete ${item.title}`
                  : "Complete the todo before deleting it"
              }
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v5M14 11v5" />
              </svg>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
