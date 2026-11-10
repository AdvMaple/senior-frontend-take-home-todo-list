import "@testing-library/jest-dom/vitest";
import * as matchers from "vitest-axe/matchers";
import { expect } from "vitest";
import { installMatchMedia } from "./match-media";

expect.extend(matchers);

/** jsdom lacks these browser APIs; Radix, cmdk and Sonner call them. */
class ResizeObserverStub {
  observe() {
    return undefined;
  }
  unobserve() {
    return undefined;
  }
  disconnect() {
    return undefined;
  }
}

// Some test files opt into `// @vitest-environment node` (no DOM).
if (typeof window !== "undefined") {
  globalThis.ResizeObserver = ResizeObserverStub;
  Element.prototype.scrollIntoView = () => undefined;
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;

  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    installMatchMedia(false);
  });
}
