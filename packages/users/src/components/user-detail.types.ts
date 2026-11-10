import type { UserId } from "@app/shared";
import type { ReactNode } from "react";

export interface UserDetailProps {
  userId: UserId;
  todosSlot: ReactNode;
  notFoundLinkSlot?: ReactNode;
  className?: string;
}
