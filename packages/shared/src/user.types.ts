export type UserId = string;

export interface User {
  id: UserId;
  username: string;
  createdAt: string;
}

export interface CreateUserInput {
  username: string;
}

export interface UserListParams {
  cursor?: string | null;
  limit?: number;
  search?: string;
}

export interface UserListFilters {
  search: string;
  limit: number;
}
