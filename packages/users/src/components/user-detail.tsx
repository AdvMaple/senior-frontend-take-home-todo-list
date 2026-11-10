import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  selectedUserIdAtom,
} from "@app/shared";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { useUser } from "../hooks/useUser";
import { ThemeControl } from "./theme-control";
import type { UserDetailProps } from "./user-detail.types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** U-4/U-5/U-6/U-8: user detail with theme control and todo slot. */
export function UserDetail({
  userId,
  todosSlot,
  notFoundLinkSlot,
  className,
}: UserDetailProps) {
  const setSelectedUserId = useSetAtom(selectedUserIdAtom);
  const { data, error, isPending, isError, isNotFound, refetch } =
    useUser(userId);

  useEffect(() => {
    if (!data) return;
    setSelectedUserId(data.id);
  }, [data, setSelectedUserId]);

  if (isPending) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="pt-6">
          <p role="status">Loading user...</p>
        </CardContent>
      </Card>
    );
  }

  if (isNotFound) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>User not found</CardTitle>
          <CardDescription>No user with this ID exists.</CardDescription>
        </CardHeader>
        <CardContent>{notFoundLinkSlot ?? null}</CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Could not load user</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Alert variant="destructive">
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>User detail</CardTitle>
        <CardDescription>View user metadata and controls.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <dl className="grid gap-2 text-sm">
          <div className="grid grid-cols-[8rem_1fr] gap-2">
            <dt className="font-medium">Username</dt>
            <dd>{data.username}</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-2">
            <dt className="font-medium">ID</dt>
            <dd>{data.id}</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-2">
            <dt className="font-medium">Created</dt>
            <dd>{formatDate(data.createdAt)}</dd>
          </div>
        </dl>

        <ThemeControl />

        <section className="grid gap-2" aria-label="User todos">
          {todosSlot}
        </section>
      </CardContent>
    </Card>
  );
}
