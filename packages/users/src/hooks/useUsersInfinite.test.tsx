import { createInMemoryApi, type ApiClient } from "@app/shared";
import { renderHookWithProviders } from "@app/shared/test";
import { act, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { USER_SEARCH_DEBOUNCE_MS, useUsersInfinite } from "./useUsersInfinite";

afterEach(() => {
  vi.useRealTimers();
});

describe("useUsersInfinite", () => {
  it("Q2: loads pages and appends on loadMore", async () => {
    const { result } = renderHookWithProviders(() =>
      useUsersInfinite({ search: "", limit: 1 })
    );

    await waitFor(() => {
      expect(result.current.users).toHaveLength(1);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.users).toHaveLength(2);
    });
    expect(result.current.hasNextPage).toBe(false);
  });

  it("Q2: debounces search text", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { result, rerender } = renderHookWithProviders(
      ({ search, limit }) => useUsersInfinite({ search, limit }),
      { initialProps: { search: "", limit: 10 } }
    );

    rerender({ search: "alice", limit: 10 });
    expect(result.current.debouncedSearch).toBe("");

    act(() => {
      vi.advanceTimersByTime(USER_SEARCH_DEBOUNCE_MS);
    });

    await waitFor(() => {
      expect(result.current.debouncedSearch).toBe("alice");
    });
  });

  it("T-14: passes AbortSignal to listUsers", async () => {
    const base = createInMemoryApi({ profile: "small", latencyMs: 0 });
    const api: ApiClient = {
      ...base,
      listUsers: vi.fn<ApiClient["listUsers"]>((params, options) =>
        base.listUsers(params, options)
      ),
    };

    renderHookWithProviders(() => useUsersInfinite({ search: "", limit: 10 }), {
      api,
    });

    await waitFor(() => {
      expect(api.listUsers).toHaveBeenCalled();
    });

    const firstCall = vi.mocked(api.listUsers).mock.calls[0];
    expect(firstCall?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });
});
