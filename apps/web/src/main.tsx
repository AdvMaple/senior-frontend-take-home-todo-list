import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Provider as JotaiProvider } from "jotai";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  ApiProvider,
  Toaster,
  createInMemoryApi,
  createQueryClient,
  useApplyTheme,
} from "@app/shared";
import { router } from "./router";
import "./styles.css";

const queryClient = createQueryClient();
const api = createInMemoryApi({ profile: "demo" });
const container = document.getElementById("root");
if (!container) throw new Error("Root element #root not found");

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useApplyTheme();
  return <>{children}</>;
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ApiProvider api={api}>
        <JotaiProvider>
          <ThemeInitializer>
            <RouterProvider router={router} context={{ queryClient }} />
          </ThemeInitializer>
          <Toaster />
        </JotaiProvider>
      </ApiProvider>
    </QueryClientProvider>
  </StrictMode>
);
