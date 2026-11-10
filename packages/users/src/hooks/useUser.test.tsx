import { ApiError, createInMemoryApi } from "@app/shared";
import { renderHookWithProviders } from "@app/shared/test";
import { waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useUser } from "./useUser";

describe("useUser", () => {
  it("U-4: loads a user by id", async () => {
    const { result } = renderHookWithProviders(() => useUser("user-1"));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.id).toBe("user-1");
    expect(result.current.data?.username).toBeTruthy();
  });

  it("U-5: exposes typed NOT_FOUND branch", async () => {
    const { result } = renderHookWithProviders(() => useUser("user-missing"));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isNotFound).toBe(true);
    expect(result.current.notFoundError?.code).toBe("NOT_FOUND");
    expect(result.current.notFoundError?.message).toBe("No user with that ID");
  });

  it("U-6: non-404 errors stay retryable", async () => {
    const api = createInMemoryApi({ profile: "small", latencyMs: 0 });
    api.failNext("getUser", new ApiError("UNKNOWN", "Network down"));

    const { result } = renderHookWithProviders(() => useUser("user-1"), {
      api,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isNotFound).toBe(false);
    expect((result.current.error as Error).message).toBe("Network down");
  });
});
