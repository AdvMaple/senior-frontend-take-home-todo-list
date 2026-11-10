import {
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Label,
} from "@app/shared";
import { useMemo, useState } from "react";
import { useUser } from "../hooks/useUser";
import { useUsersInfinite } from "../hooks/useUsersInfinite";
import type { UserComboboxProps } from "./user-combobox.types";

const DEFAULT_LIMIT = 20;

/** Q2: accessible, controlled assignee picker with debounced search and lazy loading. */
export function UserCombobox({
  value,
  onValueChange,
  label = "Assignee",
  placeholder = "Select a user",
  searchPlaceholder = "Search users",
  id = "assignee",
  disabled = false,
  required = false,
  className,
  errorMessage = null,
  describedBy,
  limit = DEFAULT_LIMIT,
}: UserComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { users, isPending, isFetchingNextPage, hasNextPage, loadMore } =
    useUsersInfinite({ search, limit });

  const selectedUserQuery = useUser(value);
  const selectedLabel = useMemo(() => {
    if (value === null) return null;
    const selected = users.find((user) => user.id === value);
    return selected?.username ?? selectedUserQuery.data?.username ?? "Loading user…";
  }, [selectedUserQuery.data?.username, users, value]);

  const errorId = `${id}-error`;
  const describedByValue = [describedBy ?? null, errorMessage ? errorId : null]
    .filter((entry): entry is string => entry !== null)
    .join(" ");

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={errorMessage !== null}
            aria-describedby={describedByValue || undefined}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">{selectedLabel ?? placeholder}</span>
            <span aria-hidden className="text-muted-foreground">
              ▾
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
          <Command shouldFilter={false}>
            <CommandInput
              aria-label="Search users"
              value={search}
              onValueChange={setSearch}
              placeholder={searchPlaceholder}
            />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={() => {
                    onValueChange(user.id);
                    setOpen(false);
                  }}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "inline-block w-3 text-center",
                      user.id === value ? "opacity-100" : "opacity-0"
                    )}
                  >
                    ✓
                  </span>
                  <span>{user.username}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
          <div className="border-t p-2">
            {isPending ? (
              <p role="status" className="text-xs text-muted-foreground">
                Loading users...
              </p>
            ) : null}
            {hasNextPage ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  void loadMore();
                }}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading..." : "Load more users"}
              </Button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      {errorMessage ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
      {required ? (
        <input
          tabIndex={-1}
          autoComplete="off"
          className="sr-only"
          required
          value={value ?? ""}
          onChange={() => undefined}
        />
      ) : null}
    </div>
  );
}
