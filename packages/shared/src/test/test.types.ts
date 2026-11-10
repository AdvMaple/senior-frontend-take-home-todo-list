import type { QueryClient } from "@tanstack/react-query";
import type { RenderHookResult, RenderResult } from "@testing-library/react";
import type { createStore } from "jotai";
import type { ComponentType, ReactNode } from "react";
import type { ApiClient } from "../api.types";
import type { InMemoryApi } from "../api/in-memory-api.types";

export type JotaiStore = ReturnType<typeof createStore>;

export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

export interface RenderWithProvidersOptions {
  /** Defaults to a fresh `createInMemoryApi({ profile: "small", latencyMs: 0 })`. */
  api?: ApiClient;
  queryClient?: QueryClient;
  store?: JotaiStore;
  /** Optional wrapper for tests that need routing (for example memory history). */
  routerWrapper?: ComponentType<{ children: ReactNode }>;
}

export interface TestProviders {
  Wrapper: ComponentType<{ children: ReactNode }>;
  api: ApiClient;
  /** Set when no `api` option was passed; gives access to `failNext`. */
  inMemoryApi: InMemoryApi | undefined;
  queryClient: QueryClient;
  store: JotaiStore;
}

export interface RenderWithProvidersResult
  extends RenderResult,
    Omit<TestProviders, "Wrapper"> {}

export interface RenderHookWithProvidersResult<Result, Props extends object>
  extends RenderHookResult<Result, Props>,
    Omit<TestProviders, "Wrapper"> {}

export interface MatchMediaController {
  setDark: (isDark: boolean) => void;
}
