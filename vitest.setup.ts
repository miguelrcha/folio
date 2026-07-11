import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount anything rendered between tests so the jsdom document stays clean.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement ResizeObserver — stub it so components that use it
// (e.g. CvStudioModal's auto-fit preview) can mount under Vitest.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
