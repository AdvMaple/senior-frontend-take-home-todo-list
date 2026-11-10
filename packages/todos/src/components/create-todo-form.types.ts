import type { ReactNode } from "react";
import type { UserId } from "@app/shared";

export interface CreateTodoFormProps {
  /** Controlled assignee ID; null means no assignee selected */
  assigneeId: UserId | null;
  /** Callback when assignee selection changes */
  onAssigneeIdChange: (id: UserId | null) => void;
  /** Pre-built UI slot for assignee selection (from web) */
  assigneePicker: ReactNode;
  /** Optional callback after successful create */
  onCreated?: () => void;
  /** Optional CSS class for the root Card */
  className?: string;
}
