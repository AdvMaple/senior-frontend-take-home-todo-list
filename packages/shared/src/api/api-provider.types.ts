import type { ReactNode } from "react";
import type { ApiClient } from "../api.types";

export interface ApiProviderProps {
  api: ApiClient;
  children: ReactNode;
}
