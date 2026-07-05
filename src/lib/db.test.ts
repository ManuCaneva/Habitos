import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateHabit } from "./db";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

const mockRow = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "X",
  description: null,
  icon: null,
  color: "#5e6ad2",
  frequency_type: "daily",
  target_per_period: 1,
  interval_days: null,
  days_of_week: null,
  sort_order: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-07-05T00:00:00.000Z",
  archived_at: null,
};

describe("db.updateHabit - shape hacia Rust", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue(mockRow);
  });

  it("aplana el patch al shape que espera Rust (no envía { patch: { ... } })", async () => {
    await updateHabit(
      "123e4567-e89b-12d3-a456-426614174000",
      { name: "Nuevo", color: "#eb5757", icon: "dumbbell" },
      "2026-07-05T00:00:00.000Z",
    );
    expect(invoke).toHaveBeenCalledWith(
      "update_habit",
      expect.objectContaining({
        input: expect.objectContaining({
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Nuevo",
          color: "#eb5757",
          icon: "dumbbell",
          updated_at: "2026-07-05T00:00:00.000Z",
        }),
      }),
    );
    const call = vi.mocked(invoke).mock.calls[0];
    const input = (call[1] as { input: Record<string, unknown> }).input;
    expect(input).not.toHaveProperty("patch");
  });
});
