import { createFileRoute, Link } from "@tanstack/react-router";
import { UserDetail } from "@app/users";
import { PAGE_SIZES } from "@app/shared";

export const Route = createFileRoute("/users/$userId")({
  component: UserPage,
});

function UserPage() {
  const { userId } = Route.useParams();

  const todosSlot = (
    <Link
      to="/todos"
      search={{
        userIds: [userId],
        page: 1,
        pageSize: PAGE_SIZES[0],
        sort: "createdAt.desc",
      }}
      className="underline text-blue-600 hover:text-blue-800"
    >
      View todos for this user
    </Link>
  );

  const notFoundLinkSlot = (
    <Link to="/users/new" className="underline text-blue-600 hover:text-blue-800">
      Create a new user
    </Link>
  );

  return (
    <>
      <h1 className="sr-only">User Detail</h1>
      <UserDetail
        userId={userId}
        todosSlot={todosSlot}
        notFoundLinkSlot={notFoundLinkSlot}
      />
    </>
  );
}
