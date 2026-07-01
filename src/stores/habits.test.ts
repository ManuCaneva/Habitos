import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useHabitsStore } from "./habits";
import * as db from "@/lib/db";

vi.mock("@/lib/db", () => ({
  listHabits: vi.fn().mockResolvedValue([]),
  createHabit: vi.fn(),
  updateHabit: vi.fn(),
  archiveHabit: vi.fn(),
  restoreHabit: vi.fn(),
  createLog: vi.fn(),
  deleteLog: vi.fn(),
  listLogsInRange: vi.fn().mockResolvedValue([]),
}));

describe("habits store - checkIn", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should call db.createLog with correct structure", async () => {
    const store = useHabitsStore();
    const habitId = "123e4567-e89b-12d3-a456-426614174000";
    const today = new Date().toISOString().slice(0, 10);
    const mockLog = {
      id: "456e4567-e89b-12d3-a456-426614174001",
      habit_id: habitId,
      log_date: today,
      completed_at: new Date().toISOString(),
      note: null,
      created_at: new Date().toISOString(),
    };

    vi.mocked(db.createLog).mockResolvedValue(mockLog);

    await store.checkIn(habitId);

    expect(db.createLog).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(db.createLog).mock.calls[0];
    const draft = callArgs[0];
    
    expect(draft).toHaveProperty("habit_id", habitId);
    expect(draft).toHaveProperty("log_date", today);
    expect(typeof callArgs[1]).toBe("string");
    expect(typeof callArgs[2]).toBe("string");
    expect(typeof callArgs[3]).toBe("string");
  });

  it("should update completedToday after checkIn", async () => {
    const store = useHabitsStore();
    const habitId = "123e4567-e89b-12d3-a456-426614174000";
    const today = new Date().toISOString().slice(0, 10);
    const mockLog = {
      id: "456e4567-e89b-12d3-a456-426614174001",
      habit_id: habitId,
      log_date: today,
      completed_at: new Date().toISOString(),
      note: null,
      created_at: new Date().toISOString(),
    };

    vi.mocked(db.createLog).mockResolvedValue(mockLog);

    expect(store.completedToday.has(habitId)).toBe(false);
    await store.checkIn(habitId);
    expect(store.completedToday.has(habitId)).toBe(true);
  });

  it("should remove log from completedToday after undoCheckIn", async () => {
    const store = useHabitsStore();
    const habitId = "123e4567-e89b-12d3-a456-426614174000";
    const today = new Date().toISOString().slice(0, 10);
    const logId = "456e4567-e89b-12d3-a456-426614174001";
    const mockLog = {
      id: logId,
      habit_id: habitId,
      log_date: today,
      completed_at: new Date().toISOString(),
      note: null,
      created_at: new Date().toISOString(),
    };

    vi.mocked(db.createLog).mockResolvedValue(mockLog);
    vi.mocked(db.deleteLog).mockResolvedValue();

    await store.checkIn(habitId);
    expect(store.completedToday.has(habitId)).toBe(true);

    await store.undoCheckIn(habitId, today);
    expect(store.completedToday.has(habitId)).toBe(false);
    expect(db.deleteLog).toHaveBeenCalledWith(logId);
  });
});
