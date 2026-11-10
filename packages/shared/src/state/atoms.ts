import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import type { UserId } from "../user.types";
import { THEME_PREFERENCES, THEME_STORAGE_KEY } from "./theme.constants";
import type { ThemePreference } from "./theme.types";

/** S-1: the user last created or viewed; default assignee and `/todos` filter. */
export const selectedUserIdAtom = atom<UserId | null>(null);

function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.some((preference) => preference === value);
}

const jsonStorage = createJSONStorage<ThemePreference>(
  () => window.localStorage
);

/** Ignores stored values that are not a known preference (edited or stale). */
const themeStorage: typeof jsonStorage = {
  ...jsonStorage,
  getItem: (key, initialValue) => {
    const stored = jsonStorage.getItem(key, initialValue);
    return isThemePreference(stored) ? stored : initialValue;
  },
};

/** S-3: app-wide appearance preference, persisted in `localStorage`. */
export const themeAtom = atomWithStorage<ThemePreference>(
  THEME_STORAGE_KEY,
  "system",
  themeStorage,
  { getOnInit: true }
);
