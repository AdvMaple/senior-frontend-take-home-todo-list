import { createFileRoute, useRouter } from "@tanstack/react-router";
import { CreateUserForm } from "@app/users";
import { PAGE_SIZES, selectedUserIdAtom } from "@app/shared";
import { useSetAtom } from "jotai";
import type { User } from "@app/shared";

export const Route = createFileRoute("/users/new")({
  component: NewUserPage,
});

function NewUserPage() {
  const router = useRouter();
  const setSelectedUserId = useSetAtom(selectedUserIdAtom);

  function handleUserCreated(user: User): void {
    setSelectedUserId(user.id);
    void router.navigate({
      to: "/todos",
      search: {
        userIds: [user.id],
        page: 1,
        pageSize: PAGE_SIZES[0],
        sort: "createdAt.desc",
      },
    });
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Create user</h1>
      <p className="mt-2 text-muted-foreground">
        Add a new user to get started.
      </p>
      <div className="mt-6">
        <CreateUserForm onCreated={handleUserCreated} />
      </div>
    </section>
  );
}
