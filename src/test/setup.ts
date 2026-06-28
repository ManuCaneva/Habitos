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
