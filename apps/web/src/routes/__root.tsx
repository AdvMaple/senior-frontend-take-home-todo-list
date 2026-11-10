import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { ThemeControl } from "@app/users";
import type { RouterContext } from "../router.types";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-background focus:p-2"
      >
        Skip to content
      </a>
      <header className="border-b">
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-3"
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link to="/todos" className="font-semibold">
              Take-Home
            </Link>
            <Link
              to="/todos"
              className="text-muted-foreground aria-[current=page]:text-foreground"
            >
              Todos
            </Link>
            <Link
              to="/users/new"
              className="text-muted-foreground aria-[current=page]:text-foreground"
            >
              New user
            </Link>
          </div>
          <ThemeControl className="w-full sm:ml-auto sm:w-auto" />
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2">
        <Link to="/todos" className="underline">
          Go to todos
        </Link>
      </p>
    </section>
  );
}
