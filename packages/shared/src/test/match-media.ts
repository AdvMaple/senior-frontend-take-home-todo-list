import { DARK_COLOR_SCHEME_QUERY } from "../state/theme.constants";
import type { MatchMediaController } from "./test.types";

/** Installs a controllable `window.matchMedia` for `prefers-color-scheme: dark`. */
export function installMatchMedia(initialDark = false): MatchMediaController {
  let isDark = initialDark;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  window.matchMedia = (query: string): MediaQueryList => {
    const list = {
      get matches() {
        return query === DARK_COLOR_SCHEME_QUERY && isDark;
      },
      media: query,
      onchange: null,
      addEventListener: (
        _type: string,
        listener: (event: MediaQueryListEvent) => void
      ) => {
        listeners.add(listener);
      },
      removeEventListener: (
        _type: string,
        listener: (event: MediaQueryListEvent) => void
      ) => {
        listeners.delete(listener);
      },
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    };
    return list as unknown as MediaQueryList;
  };

  return {
    setDark: (next) => {
      isDark = next;
      for (const listener of listeners) {
        listener({ matches: next } as MediaQueryListEvent);
      }
    },
  };
}
