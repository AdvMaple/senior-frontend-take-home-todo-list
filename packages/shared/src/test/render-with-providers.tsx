import { QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import type { ReactElement, ReactNode } from "react";
import type { ApiClient } from "../api.types";
import { ApiProvider } from "../api/api-provider";
import { createInMemoryApi } from "../api/in-memory-api";
import type { InMemoryApi } from "../api/in-memory-api.types";
import { Toaster } from "../ui/sonner";
import { createTestQueryClient } from "./create-test-query-client";
import type {
  RenderHookWithProvidersResult,
  RenderWithProvidersOptions,
  RenderWithProvidersResult,
  TestProviders,
} from "./test.types";

function createTestProviders(options: RenderWithProvidersOptions): TestProviders {
  const inMemoryApi: InMemoryApi | undefined = options.api
    ? undefined
    : createInMemoryApi({ profile: "small", latencyMs: 0 });
  const api: ApiClient = options.api ?? inMemoryApi ?? createInMemoryApi();
  const queryClient = options.queryClient ?? createTestQueryClient();
  const store = options.store ?? createStore();
  const RouterWrapper = options.routerWrapper;

  function Wrapper({ children }: { children: ReactNode }) {
    const content = (
      <ApiProvider api={api}>
        {children}
        <Toaster />
      </ApiProvider>
    );

    return (
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          {RouterWrapper ? (
            <RouterWrapper>{content}</RouterWrapper>
          ) : (
            content
          )}
        </Provider>
      </QueryClientProvider>
    );
  }

  return { Wrapper, api, inMemoryApi, queryClient, store };
}

/**
 * Renders `ui` with a fresh in-memory API, QueryClient and Jotai store, plus
 * the Toaster so toast roles can be asserted.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
): RenderWithProvidersResult {
  const { Wrapper, ...providers } = createTestProviders(options);
  const result = render(ui, { wrapper: Wrapper });
  return { ...result, ...providers };
}

/** Same providers as `renderWithProviders`, for testing hooks directly. */
export function renderHookWithProviders<Result, Props extends object>(
  hook: (props: Props) => Result,
  options: RenderWithProvidersOptions & { initialProps?: Props } = {}
): RenderHookWithProvidersResult<Result, Props> {
  const { Wrapper, ...providers } = createTestProviders(options);
  const hookOptions: {
    wrapper: typeof Wrapper;
    initialProps?: Props;
  } = { wrapper: Wrapper };

  if (options.initialProps !== undefined) {
    hookOptions.initialProps = options.initialProps;
  }

  const result = renderHook(hook, hookOptions);
  return { ...result, ...providers };
}
