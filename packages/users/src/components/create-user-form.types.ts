import type { User } from "@app/shared";

export interface CreateUserFormProps {
  onCreated?: (user: User) => void;
  className?: string;
}

export interface CreateUserFormErrors {
  username: string | null;
  retryHint: string | null;
}
