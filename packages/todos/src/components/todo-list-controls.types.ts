import type { ReactNode } from "react";
import type { PageSize, TodoSort } from "@app/shared";

export interface TodoListControlsProps {
  page: number;
  pageSize: PageSize;
  sort: TodoSort;
  total: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
  onSortChange: (sort: TodoSort) => void;
  filterSlot?: ReactNode;
  /** Set false when TodoListPagination is rendered separately below the list. */
  showPagination?: boolean;
  className?: string;
}

export interface TodoListPaginationProps {
  page: number;
  pageSize: PageSize;
  total: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
  className?: string;
}
