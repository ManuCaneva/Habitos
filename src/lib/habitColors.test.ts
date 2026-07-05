import { describe, it, expect } from "vitest";
import { shadeFor } from "./habitColors";

describe("shadeFor", () => {
  it("intensity 1 → color al 100%", () => {
    expect(shadeFor("#5e6ad2", 1)).toBe("rgba(94, 106, 210, 1)");
  });
  it("intensity 0.15 → color al 15%", () => {
    expect(shadeFor("#5e6ad2", 0.15)).toBe("rgba(94, 106, 210, 0.15)");
  });
  it("maneja color sin #", () => {
    expect(shadeFor("5e6ad2", 1)).toBe("rgba(94, 106, 210, 1)");
  });
});
