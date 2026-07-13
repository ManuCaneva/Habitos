import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";

const mockPixelRatio = ref(1);
vi.mock("@vueuse/core", () => ({
  useDevicePixelRatio: () => ({ pixelRatio: mockPixelRatio }),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    onMoved: vi.fn().mockResolvedValue(() => {}),
  }),
}));

import { useMonitorChange } from "./useMonitorChange";

describe("useMonitorChange", () => {
  beforeEach(() => {
    mockPixelRatio.value = 1;
  });

  it("changed empieza en false", () => {
    const { changed } = useMonitorChange();
    expect(changed.value).toBe(false);
  });

  it("cambia a true cuando pixelRatio cambia", async () => {
    const { changed } = useMonitorChange();
    mockPixelRatio.value = 2;
    await new Promise((r) => setTimeout(r, 0));
    expect(changed.value).toBe(true);
  });

  it("ackChange resetea changed a false", async () => {
    const { changed, ackChange } = useMonitorChange();
    mockPixelRatio.value = 2;
    await new Promise((r) => setTimeout(r, 0));
    expect(changed.value).toBe(true);
    ackChange();
    expect(changed.value).toBe(false);
  });

  it("no cambia si pixelRatio es el mismo", async () => {
    const { changed } = useMonitorChange();
    mockPixelRatio.value = 1;
    await new Promise((r) => setTimeout(r, 0));
    expect(changed.value).toBe(false);
  });
});
