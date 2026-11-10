import { QueryClient } from "@tanstack/react-query";

/** Fresh client per test: no retries, nothing garbage collected mid-test. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
}
