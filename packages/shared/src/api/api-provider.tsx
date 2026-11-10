import { createContext, useContext } from "react";
import type { ApiClient } from "../api.types";
import type { ApiProviderProps } from "./api-provider.types";

const ApiContext = createContext<ApiClient | null>(null);

export function ApiProvider({ api, children }: ApiProviderProps) {
  return <ApiContext value={api}>{children}</ApiContext>;
}

/** The injected `ApiClient`. Hooks use it so the backend stays swappable (A-4). */
export function useApi(): ApiClient {
  const api = useContext(ApiContext);
  if (!api) throw new Error("useApi must be used inside <ApiProvider>");
  return api;
}
