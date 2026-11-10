import type { ApiErrorCode } from "../api.types";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  /** Set for RATE_LIMITED: ms until a retry can succeed. */
  readonly retryAfterMs: number | undefined;

  constructor(code: ApiErrorCode, message: string, retryAfterMs?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function createAbortError(): DOMException {
  return new DOMException("The operation was aborted.", "AbortError");
}
