import type { ApiClient, ApiOperation } from "../api.types";
import type { ApiError } from "./api-error";
import type { DatasetProfile, SeedTodo } from "./dataset.types";

export interface LatencyRange {
  minMs: number;
  maxMs: number;
}

export interface InMemoryApiOptions {
  profile?: DatasetProfile;
  /** Fixed delay in ms, or a seeded random range. Default 0. */
  latencyMs?: number | LatencyRange;
  /** Injectable clock (ms since epoch) for createdAt and the rate limit. */
  now?: () => number;
}

export interface InMemoryApi extends ApiClient {
  /** Makes the next call of `operation` reject (once). Calls queue up. */
  failNext: (operation: ApiOperation, error?: ApiError) => void;
}

export interface TodoRecord extends SeedTodo {
  /** Insertion order; breaks createdAt ties so sorting is stable. */
  seq: number;
}
