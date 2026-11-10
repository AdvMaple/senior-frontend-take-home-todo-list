import type { UserId } from "@app/shared";

export interface UserComboboxProps {
  value: UserId | null;
  onValueChange: (userId: UserId) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  errorMessage?: string | null;
  describedBy?: string;
  limit?: number;
}
