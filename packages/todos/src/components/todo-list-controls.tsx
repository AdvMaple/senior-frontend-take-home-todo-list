import {
  PAGE_SIZES,
  TODO_SORTS,
  Label,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  cn,
} from "@app/shared";
import { useCallback } from "react";
import type {
  TodoListControlsProps,
  TodoListPaginationProps,
} from "./todo-list-controls.types";

/** T-11: controlled toolbar for todo list filtering and sorting. */
export function TodoListControls({
  sort,
  isFetching = false,
  onSortChange,
  filterSlot,
  showPagination = true,
  className,
  ...paginationProps
}: TodoListControlsProps) {
  const handleSortChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onSortChange(event.currentTarget.value as typeof sort);
    },
    [onSortChange]
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {filterSlot ? <div>{filterSlot}</div> : null}

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="sort-select">Sort</Label>
          <select
            id="sort-select"
            value={sort}
            onChange={handleSortChange}
            disabled={isFetching}
            className="rounded border border-input bg-background px-3 py-2 text-sm disabled:pointer-events-none disabled:opacity-50"
          >
            {TODO_SORTS.map((sortOption) => (
              <option key={sortOption} value={sortOption}>
                {sortOption === "createdAt.desc" ? "Newest first" : "Oldest first"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showPagination ? (
        <TodoListPagination {...paginationProps} isFetching={isFetching} />
      ) : null}
    </div>
  );
}

/** T-12/T-13: shadcn-styled pagination rendered beneath the todo list. */
export function TodoListPagination({
  page,
  pageSize,
  total,
  isFetching = false,
  onPageChange,
  onPageSizeChange,
  className,
}: TodoListPaginationProps) {
  const canGoPrevious = page > 1;
  const canGoNext = page * pageSize < total;
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);
  const statusMessage =
    total > 0
      ? `Showing items ${startItem.toString()}–${endItem.toString()} of ${total.toString()}`
      : "No items";

  const handlePageSizeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onPageSizeChange(Number(event.currentTarget.value) as typeof pageSize);
    },
    [onPageSizeChange]
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Label htmlFor="pagesize-select" className="whitespace-nowrap">
          Page size
        </Label>
        <div className="relative">
          <select
            id="pagesize-select"
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={isFetching}
            className="appearance-none rounded border border-input bg-background px-3 py-2 pr-9 text-sm disabled:pointer-events-none disabled:opacity-50"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      <Pagination className="mx-0 w-auto sm:mx-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => {
                onPageChange(page - 1);
              }}
              disabled={!canGoPrevious || isFetching}
            />
          </PaginationItem>
          <PaginationItem>
            <span
              aria-current="page"
              className="flex size-9 items-center justify-center rounded-md border text-sm font-medium"
            >
              {page}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => {
                onPageChange(page + 1);
              }}
              disabled={!canGoNext || isFetching}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <p
        role="status"
        className="text-sm text-muted-foreground sm:text-right"
        aria-live="polite"
        aria-atomic="true"
      >
        {statusMessage}
      </p>
    </div>
  );
}
