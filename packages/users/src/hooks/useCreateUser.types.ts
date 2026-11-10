import type { CreateUserInput, User } from "@app/shared";

export interface UseCreateUserResult {
  createUser: (input: CreateUserInput) => Promise<User>;
  clearErrors: () => void;
  isPending: boolean;
  isSubmitDisabled: boolean;
  usernameError: string | null;
  retryHint: string | null;
}
