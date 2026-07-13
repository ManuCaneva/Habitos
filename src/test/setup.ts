import { afterEach, beforeEach } from "vitest";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $t: (key: string) => string;
  }
}

beforeEach(() => {
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }
});

afterEach(() => {
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }
});

if (typeof globalThis.ResizeObserver === "undefined") {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
}
