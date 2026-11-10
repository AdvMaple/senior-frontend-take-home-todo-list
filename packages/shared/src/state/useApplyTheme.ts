import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { themeAtom } from "./atoms";
import { DARK_COLOR_SCHEME_QUERY } from "./theme.constants";

function setDarkClass(isDark: boolean): void {
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
}

/** Applies `themeAtom` to `<html>`; `system` follows the OS and reacts to changes. */
export function useApplyTheme(): void {
  const theme = useAtomValue(themeAtom);

  useEffect(() => {
    if (theme !== "system") {
      setDarkClass(theme === "dark");
      return;
    }
    const query = window.matchMedia(DARK_COLOR_SCHEME_QUERY);
    const apply = () => {
      setDarkClass(query.matches);
    };
    apply();
    query.addEventListener("change", apply);
    return () => {
      query.removeEventListener("change", apply);
    };
  }, [theme]);
}
