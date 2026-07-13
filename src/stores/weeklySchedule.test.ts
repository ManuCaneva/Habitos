import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import {
  useWeeklyScheduleStore,
  minutesToHHMM,
  hhmmToMinutes,
  snapToSlot,
  overlaps,
} from "./weeklySchedule";
import * as db from "@/lib/db";

vi.mock("@/lib/db", () => ({
  listScheduleBlocks: vi.fn().mockResolvedValue([]),
  createScheduleBlock: vi.fn(),
  updateScheduleBlock: vi.fn(),
  deleteScheduleBlock: vi.fn(),
  upsertAllScheduleBlocks: vi.fn(),
  loadWeeklyScheduleSettings: vi.fn().mockResolvedValue({
    granularity_minutes: 30,
    day_start_minutes: 360,
    day_end_minutes: 1380,
    week_starts_monday: true,
  }),
  saveWeeklyScheduleSettings: vi.fn(),
}));

describe("weeklySchedule store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe("HH:MM y minutos conversions", () => {
    it("convierte minutos a string HH:MM", () => {
      expect(minutesToHHMM(0)).toBe("00:00");
      expect(minutesToHHMM(360)).toBe("06:00");
      expect(minutesToHHMM(1439)).toBe("23:59");
    });

    it("convierte string HH:MM a minutos", () => {
      expect(hhmmToMinutes("00:00")).toBe(0);
      expect(hhmmToMinutes("06:00")).toBe(360);
      expect(hhmmToMinutes("23:59")).toBe(1439);
    });

    it("lanza error con HH:MM inválidos", () => {
      expect(() => hhmmToMinutes("invalid")).toThrow();
      expect(() => hhmmToMinutes("25:00")).toThrow();
      expect(() => hhmmToMinutes("12:60")).toThrow();
    });
  });

  describe("snapToSlot", () => {
    it("ajusta minutos a la granularidad indicada", () => {
      expect(snapToSlot(45, 30)).toBe(30);
      expect(snapToSlot(59, 30)).toBe(30);
      expect(snapToSlot(60, 30)).toBe(60);
      expect(snapToSlot(14, 15)).toBe(0);
      expect(snapToSlot(15, 15)).toBe(15);
    });
  });

  describe("overlaps", () => {
    it("detecta solapamientos", () => {
      // Bloque A: 06:00 a 07:00 (360-420)
      // Bloque B: 06:30 a 07:30 (390-450)
      expect(overlaps(
        { start_minutes: 360, end_minutes: 420 },
        { start_minutes: 390, end_minutes: 450 }
      )).toBe(true);

      // Bloque A y B no se solapan (tocan pero no solapan)
      expect(overlaps(
        { start_minutes: 360, end_minutes: 420 },
        { start_minutes: 420, end_minutes: 480 }
      )).toBe(false);

      // Bloque A contiene a B
      expect(overlaps(
        { start_minutes: 360, end_minutes: 480 },
        { start_minutes: 390, end_minutes: 420 }
      )).toBe(true);
    });
  });

  describe("Lógica del Store", () => {
    it("carga bloques y configuraciones", async () => {
      const store = useWeeklyScheduleStore();
      const mockRow = {
        id: "111e8400-e29b-41d4-a716-446655440000",
        day_of_week: 0,
        start_minutes: 360,
        end_minutes: 420,
        title: "Gimnasio",
        color: "lavender",
        sort_order: 0,
        created_at: "2026-07-12T19:00:00.000Z",
        updated_at: "2026-07-12T19:00:00.000Z",
      };
      vi.mocked(db.listScheduleBlocks).mockResolvedValue([mockRow]);

      await store.loadAll();

      expect(store.blocks).toHaveLength(1);
      expect(store.blocks[0]).toEqual({
        id: "111e8400-e29b-41d4-a716-446655440000",
        day_of_week: 0,
        start_minutes: 360,
        end_minutes: 420,
        title: "Gimnasio",
        color: "lavender",
        sort_order: 0,
        created_at: "2026-07-12T19:00:00.000Z",
        updated_at: "2026-07-12T19:00:00.000Z",
      });
      expect(store.settings.granularity_minutes).toBe(30);
    });

    it("crea un bloque nuevo si no hay solapamiento", async () => {
      const store = useWeeklyScheduleStore();
      const mockRow = {
        id: "222e8400-e29b-41d4-a716-446655440000",
        day_of_week: 1,
        start_minutes: 480,
        end_minutes: 540,
        title: "Estudio",
        color: "green",
        sort_order: 0,
        created_at: "2026-07-12T19:00:00.000Z",
        updated_at: "2026-07-12T19:00:00.000Z",
      };
      vi.mocked(db.createScheduleBlock).mockResolvedValue(mockRow);

      const draft = {
        day_of_week: 1,
        start_minutes: 480,
        end_minutes: 540,
        title: "Estudio",
        color: "green" as const,
        sort_order: 0,
      };

      const block = await store.createBlock(draft);

      expect(block.id).toBe("222e8400-e29b-41d4-a716-446655440000");
      expect(store.blocks).toContainEqual(block);
      expect(db.createScheduleBlock).toHaveBeenCalledTimes(1);
    });

    it("rechaza la creación de un bloque si hay solapamiento", async () => {
      const store = useWeeklyScheduleStore();
      store.blocks = [{
        id: "333e8400-e29b-41d4-a716-446655440000",
        day_of_week: 1,
        start_minutes: 480,
        end_minutes: 540,
        title: "Gimnasio",
        color: "lavender",
        sort_order: 0,
        created_at: "2026-07-12T19:00:00.000Z",
        updated_at: "2026-07-12T19:00:00.000Z",
      }];

      const draft = {
        day_of_week: 1,
        start_minutes: 500, // solapa con 480-540
        end_minutes: 560,
        title: "Estudio",
        color: "green" as const,
        sort_order: 0,
      };

      await expect(store.createBlock(draft)).rejects.toThrow("solapa");
      expect(db.createScheduleBlock).not.toHaveBeenCalled();
    });

    it("mueve un bloque tras DnD si no hay solapamiento", async () => {
      const store = useWeeklyScheduleStore();
      const initialBlock = {
        id: "333e8400-e29b-41d4-a716-446655440000",
        day_of_week: 1,
        start_minutes: 480,
        end_minutes: 540,
        title: "Gimnasio",
        color: "lavender" as const,
        sort_order: 0,
        created_at: "2026-07-12T19:00:00.000Z",
        updated_at: "2026-07-12T19:00:00.000Z",
      };
      store.blocks = [initialBlock];

      const mockUpdatedRow = {
        ...initialBlock,
        day_of_week: 2,
        start_minutes: 600,
        end_minutes: 660,
        updated_at: "2026-07-12T19:05:00.000Z",
      };
      vi.mocked(db.updateScheduleBlock).mockResolvedValue(mockUpdatedRow);

      await store.moveBlockAfterDrag("333e8400-e29b-41d4-a716-446655440000", 2, 600, 660);

      expect(store.blocks[0].day_of_week).toBe(2);
      expect(store.blocks[0].start_minutes).toBe(600);
      expect(db.updateScheduleBlock).toHaveBeenCalledTimes(1);
    });

    it("rechaza mover un bloque si hay solapamiento", async () => {
      const store = useWeeklyScheduleStore();
      store.blocks = [
        {
          id: "333e8400-e29b-41d4-a716-446655440000",
          day_of_week: 1,
          start_minutes: 480,
          end_minutes: 540,
          title: "Gimnasio",
          color: "lavender",
          sort_order: 0,
          created_at: "2026-07-12T19:00:00.000Z",
          updated_at: "2026-07-12T19:00:00.000Z",
        },
        {
          id: "444e8400-e29b-41d4-a716-446655440000",
          day_of_week: 2,
          start_minutes: 600,
          end_minutes: 660,
          title: "Estudio",
          color: "green",
          sort_order: 0,
          created_at: "2026-07-12T19:00:00.000Z",
          updated_at: "2026-07-12T19:00:00.000Z",
        }
      ];

      await expect(
        store.moveBlockAfterDrag("333e8400-e29b-41d4-a716-446655440000", 2, 620, 680) // solapa con obstacle (600-660) en el día 2
      ).rejects.toThrow("overlap");

      expect(db.updateScheduleBlock).not.toHaveBeenCalled();
    });
  });
});
