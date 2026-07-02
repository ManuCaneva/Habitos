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

  it("loadInitialData pide rango de 91 días", async () => {
    vi.mocked(db.listLogsInRange).mockResolvedValue([]);
    vi.mocked(db.listHabits).mockResolvedValue([]);
    const store = useHabitsStore();
    await store.loadInitialData();
    const call = vi.mocked(db.listLogsInRange).mock.calls[0];
    const [fromArg, toArg] = call as [string, string];
    const days = Math.round((new Date(toArg).getTime() - new Date(fromArg).getTime()) / 86400000) + 1;
    expect(days).toBe(91);
  });

  it("streakFor cuenta días consecutivos", async () => {
    vi.mocked(db.listHabits).mockResolvedValue([{
      id: "11111111-1111-1111-1111-111111111111", name: "X", description: null, icon: null, color: "#5e6ad2",
      frequency_type: "daily", target_per_period: 1, interval_days: null, days_of_week: null,
      sort_order: 0,
      created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z", archived_at: null,
    }]);
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yStr = y.toISOString().slice(0, 10);
    vi.mocked(db.listLogsInRange).mockResolvedValue([
      { id: "aaaaaaa1-1111-1111-1111-111111111111", habit_id: "11111111-1111-1111-1111-111111111111", log_date: today, completed_at: now, note: null, created_at: now },
      { id: "bbbbbbb1-1111-1111-1111-111111111111", habit_id: "11111111-1111-1111-1111-111111111111", log_date: yStr, completed_at: y.toISOString(), note: null, created_at: y.toISOString() },
    ]);
    const store = useHabitsStore();
    await store.loadInitialData();
    expect(store.streakFor("11111111-1111-1111-1111-111111111111")).toBeGreaterThanOrEqual(2);
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
