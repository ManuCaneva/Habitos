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

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("habits store - checkIn", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should call db.createLog with correct structure", async () => {
    const store = useHabitsStore();
    const habitId = "123e4567-e89b-12d3-a456-426614174000";
    const today = todayLocalDate();
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
    const today = todayLocalDate();
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
    const today = todayLocalDate();
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
    vi.mocked(db.listLogsInRange).mockResolvedValue([
      { id: "aaaaaaa1-1111-1111-1111-111111111111", habit_id: "11111111-1111-1111-1111-111111111111", log_date: today, completed_at: now, note: null, created_at: now },
      { id: "bbbbbbb1-1111-1111-1111-111111111111", habit_id: "11111111-1111-1111-1111-111111111111", log_date: yStr, completed_at: y.toISOString(), note: null, created_at: y.toISOString() },
    ]);
    const store = useHabitsStore();
    await store.loadInitialData();
    expect(store.streakFor("11111111-1111-1111-1111-111111111111")).toBeGreaterThanOrEqual(2);
  });

  it("updateHabit reemplaza el hábito en el store con los valores nuevos", async () => {
    const store = useHabitsStore();
    const habitId = "123e4567-e89b-12d3-a456-426614174000";
    vi.mocked(db.listHabits).mockResolvedValueOnce([{
      id: habitId,
      name: "Viejo",
      description: null,
      icon: "footprints",
      color: "#5e6ad2",
      frequency_type: "daily",
      target_per_period: 1,
      interval_days: null,
      days_of_week: null,
      sort_order: 0,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      archived_at: null,
    }]);
    await store.loadHabits();

    vi.mocked(db.updateHabit).mockResolvedValueOnce({
      id: habitId,
      name: "Nuevo",
      description: null,
      icon: "dumbbell",
      color: "#eb5757",
      frequency_type: "daily",
      target_per_period: 1,
      interval_days: null,
      days_of_week: null,
      sort_order: 0,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-07-05T00:00:00.000Z",
      archived_at: null,
    });

    await store.updateHabit(habitId, {
      name: "Nuevo",
      color: "#eb5757",
      icon: "dumbbell",
    });

    expect(store.habits).toHaveLength(1);
    expect(store.habits[0].name).toBe("Nuevo");
    expect(store.habits[0].color).toBe("#eb5757");
    expect(store.habits[0].icon).toBe("dumbbell");
  });

  it("should remove log from completedToday after undoCheckIn", async () => {
    const store = useHabitsStore();
    const habitId = "123e4567-e89b-12d3-a456-426614174000";
    const today = todayLocalDate();
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

  it("loadInitialData normaliza timestamps y carga todos los logs", async () => {
    const habitId = "11111111-1111-1111-1111-111111111111";
    const now = new Date().toISOString();
    const today = todayLocalDate();
    vi.mocked(db.listHabits).mockResolvedValue([{
      id: habitId, name: "Test", description: null, icon: null, color: "#5e6ad2",
      frequency_type: "daily", target_per_period: 1, interval_days: null, days_of_week: null,
      sort_order: 0,
      created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z", archived_at: null,
    }]);
    vi.mocked(db.listLogsInRange).mockResolvedValue([
      { id: "aaaaaaaa-1111-1111-1111-111111111111", habit_id: habitId, log_date: today, completed_at: now, note: null, created_at: now },
      { id: "bbbbbbbb-1111-1111-1111-111111111111", habit_id: habitId, log_date: today, completed_at: "2026-07-05 15:30:45", note: null, created_at: "2026-07-05 15:30:45" },
    ]);
    const store = useHabitsStore();
    await store.loadInitialData();
    expect(store.logs).toHaveLength(2);
    expect(store.logs[1].completed_at).toBe("2026-07-05T15:30:45Z");
    expect(store.lastError).toBeNull();
  });
});
