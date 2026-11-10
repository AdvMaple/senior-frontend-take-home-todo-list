import {
  ApiError,
  isApiError,
  notify,
  selectedUserIdAtom,
  useApi,
  userKeys,
} from "@app/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import type { UseCreateUserResult } from "./useCreateUser.types";

export const CLIENT_CREATE_THROTTLE_MS = 1_000;

function formatRetryHint(retryAfterMs: number): string {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return `Try again in ${String(seconds)} second${seconds === 1 ? "" : "s"}.`;
}

/** U-7: one create request per second from the client, plus server rate-limit handling. */
export function useCreateUser(): UseCreateUserResult {
  const api = useApi();
  const queryClient = useQueryClient();
  const setSelectedUserId = useSetAtom(selectedUserIdAtom);
  const [throttleUntil, setThrottleUntil] = useState<number | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [retryHint, setRetryHint] = useState<string | null>(null);

  const clearErrors = useCallback(() => {
    setUsernameError(null);
    setRetryHint(null);
  }, []);

  useEffect(() => {
    if (throttleUntil === null) return;

    const timer = window.setTimeout(
      () => {
        setThrottleUntil(null);
      },
      Math.max(0, throttleUntil - Date.now())
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [throttleUntil]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (input: Parameters<typeof api.createUser>[0]) =>
      api.createUser(input),
    onSuccess: async (user) => {
      clearErrors();
      setSelectedUserId(user.id);
      await queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => {
      if (!isApiError(error)) {
        notify.error("Could not create user");
        return;
      }

      if (error.code === "CONFLICT") {
        setUsernameError(error.message);
        notify.error(error.message);
        return;
      }

      if (error.code === "RATE_LIMITED") {
        const hint = formatRetryHint(
          error.retryAfterMs ?? CLIENT_CREATE_THROTTLE_MS
        );
        setRetryHint(hint);
        notify.error(hint);
      }
    },
  });

  const createUser: UseCreateUserResult["createUser"] = useCallback(
    async (input) => {
      const now = Date.now();

      if (throttleUntil !== null && throttleUntil > now) {
        const retryAfterMs = throttleUntil - now;
        const hint = formatRetryHint(retryAfterMs);
        setRetryHint(hint);
        notify.error(hint);
        throw new ApiError("RATE_LIMITED", hint, retryAfterMs);
      }

      clearErrors();
      setThrottleUntil(now + CLIENT_CREATE_THROTTLE_MS);

      try {
        return await mutateAsync(input);
      } catch (error) {
        if (
          isApiError(error) &&
          error.code === "RATE_LIMITED" &&
          typeof error.retryAfterMs === "number"
        ) {
          const limitUntil = Date.now() + error.retryAfterMs;
          setThrottleUntil(limitUntil);
        }
        throw error;
      }
    },
    [clearErrors, mutateAsync, throttleUntil]
  );

  return {
    createUser,
    clearErrors,
    isPending,
    isSubmitDisabled: isPending || throttleUntil !== null,
    usernameError,
    retryHint,
  };
}
