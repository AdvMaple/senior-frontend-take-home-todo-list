import type { ReactNode } from "react";
import type { TodoListParams, UserId } from "@app/shared";
import type { TodoListItem } from "../todo.types";

export interface TodosWorkspaceProps {
  /** Controlled list parameters (userIds, page, pageSize, sort). */
  params: TodoListParams;

  /** Called when any list parameter changes (page, sort, pageSize). */
  onParamsChange: (next: TodoListParams) => void;

  /** Controlled assignee ID for creating todos. */
  assigneeId: UserId | null;

  /** Called when assignee selection changes. */
  onAssigneeIdChange: (id: UserId | null) => void;

  /** Pre-built UI slot for assignee selection (from web). */
  assigneePicker: ReactNode;

  /** Optional UI slot for list filtering (e.g., user filter). */
  filterSlot?: ReactNode;

  /** Optional UI slot for a todo row's assignee. */
  renderAssignee?: (item: TodoListItem) => ReactNode;

  /** Optional CSS class for the root container. */
  className?: string;
}
