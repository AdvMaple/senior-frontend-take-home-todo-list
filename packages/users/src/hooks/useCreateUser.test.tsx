import {
  type ApiError,
  isApiError,
  selectedUserIdAtom,
  userKeys,
} from "@app/shared";
import { renderHookWithProviders } from "@app/shared/test";
import { act, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CLIENT_CREATE_THROTTLE_MS, useCreateUser } from "./useCreateUser";

afterEach(() => {
  vi.useRealTimers();
});

describe("useCreateUser", () => {
  it("D-1/S-1: success sets selectedUserIdAtom and invalidates userKeys.all", async () => {
    const { result, queryClient, store } = renderHookWithProviders(() =>
      useCreateUser()
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    let createdId = "";
    await act(async () => {
      const created = await result.current.createUser({
        username: "alice_new",
      });
      createdId = created.id;
    });

    expect(store.get(selectedUserIdAtom)).toBe(createdId);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: userKeys.all });
  });

  it("U-3: duplicate username keeps value flow and exposes a field error", async () => {
    const { result, api } = renderHookWithProviders(() => useCreateUser());

    await act(async () => {
      await api.createUser({ username: "taken_name" });
    });

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.createUser({ username: "taken_name" });
      } catch (error) {
        thrown = error;
      }
    });

    expect(isApiError(thrown)).toBe(true);
    expect((thrown as ApiError).code).toBe("CONFLICT");
    expect(result.current.usernameError).toBe("That username is already taken");
  });

  it("U-7: client throttle rejects rapid repeat submits", async () => {
    const { result } = renderHookWithProviders(() => useCreateUser());

    await act(async () => {
      await result.current.createUser({ username: "throttle_1" });
    });

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.createUser({ username: "throttle_2" });
      } catch (error) {
        thrown = error;
      }
    });

    expect(isApiError(thrown)).toBe(true);
    expect((thrown as ApiError).code).toBe("RATE_LIMITED");
    expect(result.current.isSubmitDisabled).toBe(true);
  });

  it("U-7: API rate limiting surfaces retry hint", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const { result } = renderHookWithProviders(() => useCreateUser());

    await act(async () => {
      await result.current.createUser({ username: "rate_u1" });
    });
    act(() => {
      vi.advanceTimersByTime(CLIENT_CREATE_THROTTLE_MS);
      vi.setSystemTime(Date.now() + CLIENT_CREATE_THROTTLE_MS);
    });

    await act(async () => {
      await result.current.createUser({ username: "rate_u2" });
    });
    act(() => {
      vi.advanceTimersByTime(CLIENT_CREATE_THROTTLE_MS);
      vi.setSystemTime(Date.now() + CLIENT_CREATE_THROTTLE_MS);
    });

    await act(async () => {
      await result.current.createUser({ username: "rate_u3" });
    });
    act(() => {
      vi.advanceTimersByTime(CLIENT_CREATE_THROTTLE_MS);
      vi.setSystemTime(Date.now() + CLIENT_CREATE_THROTTLE_MS);
    });

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.createUser({ username: "rate_u4" });
      } catch (error) {
        thrown = error;
      }
    });

    expect(isApiError(thrown)).toBe(true);
    expect((thrown as ApiError).code).toBe("RATE_LIMITED");
    await waitFor(() => {
      expect(result.current.retryHint).toMatch(/^Try again in \d+ second/);
    });
  });
});
