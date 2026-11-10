import { act, render } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "../test/match-media";
import { selectedUserIdAtom, themeAtom } from "./atoms";
import { useApplyTheme } from "./useApplyTheme";

function ThemeApplier() {
  useApplyTheme();
  return null;
}

function renderApplier(store = createStore()) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }
  render(<ThemeApplier />, { wrapper: Wrapper });
  return store;
}

const isDark = () => document.documentElement.classList.contains("dark");

/** Re-imports the atoms, like a page reload: storage is read when the module loads. */
async function loadThemeAtomAfterReload() {
  vi.resetModules();
  return (await import("./atoms")).themeAtom;
}

describe("themeAtom (S-3, U-8)", () => {
  it("S-3: defaults to system", () => {
    expect(createStore().get(themeAtom)).toBe("system");
  });

  it("S-3: persists to localStorage and restores after a reload", async () => {
    createStore().set(themeAtom, "dark");
    expect(window.localStorage.getItem("theme")).toBe('"dark"');
    const reloaded = await loadThemeAtomAfterReload();
    expect(createStore().get(reloaded)).toBe("dark");
  });

  it("S-3: ignores an unknown stored value", async () => {
    window.localStorage.setItem("theme", '"neon"');
    const reloaded = await loadThemeAtomAfterReload();
    expect(createStore().get(reloaded)).toBe("system");
  });
});

describe("selectedUserIdAtom (S-1)", () => {
  it("S-1: starts empty and holds a user id", () => {
    const store = createStore();
    expect(store.get(selectedUserIdAtom)).toBeNull();
    store.set(selectedUserIdAtom, "user-1");
    expect(store.get(selectedUserIdAtom)).toBe("user-1");
  });
});

describe("useApplyTheme (S-3, U-8)", () => {
  it("U-8: dark adds class dark to <html>, light removes it", () => {
    const store = renderApplier();
    act(() => {
      store.set(themeAtom, "dark");
    });
    expect(isDark()).toBe(true);
    act(() => {
      store.set(themeAtom, "light");
    });
    expect(isDark()).toBe(false);
  });

  it("S-3: system follows prefers-color-scheme and reacts to changes", () => {
    const media = installMatchMedia(true);
    renderApplier();
    expect(isDark()).toBe(true);
    act(() => {
      media.setDark(false);
    });
    expect(isDark()).toBe(false);
    act(() => {
      media.setDark(true);
    });
    expect(isDark()).toBe(true);
  });

  it("S-3: an explicit choice ignores later OS changes", () => {
    const media = installMatchMedia(false);
    const store = renderApplier();
    act(() => {
      store.set(themeAtom, "light");
    });
    act(() => {
      media.setDark(true);
    });
    expect(isDark()).toBe(false);
  });

  it("S-3: applies a stored preference on first render", () => {
    window.localStorage.setItem("theme", '"dark"');
    renderApplier();
    expect(isDark()).toBe(true);
  });
});
