import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import WeeklyScheduleModal from "./WeeklyScheduleModal.vue";

const mockStore = {
  createBlock: vi.fn(),
  updateBlock: vi.fn(),
  deleteBlock: vi.fn(),
  validateBlock: vi.fn().mockReturnValue({ ok: true }),
};

vi.mock("@/stores/weeklySchedule", () => ({
  useWeeklyScheduleStore: () => mockStore,
  BLOCK_COLOR_TOKENS: ["lavender", "green"] as const,
  minutesToHHMM: (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  },
  hhmmToMinutes: (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  },
}));

describe("WeeklyScheduleModal", () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    document.body.innerHTML = "";
  });

  const validBlock = {
    id: "333e8400-e29b-41d4-a716-446655440000",
    day_of_week: 1,
    start_minutes: 360,
    end_minutes: 420,
    title: "Gimnasio",
    color: "lavender" as const,
    sort_order: 0,
    created_at: "2026-07-12T19:00:00.000Z",
    updated_at: "2026-07-12T19:00:00.000Z",
  };

  it("renderiza el título 'Nuevo bloque' si block es null", () => {
    wrapper = mount(WeeklyScheduleModal, {
      props: {
        open: true,
        block: null,
      },
      attachTo: document.body,
    });

    const dialog = document.body.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();
    expect(dialog!.textContent).toContain("Nuevo bloque");
  });

  it("renderiza el título 'Editar bloque' e inputs llenos si block es provisto", () => {
    wrapper = mount(WeeklyScheduleModal, {
      props: {
        open: true,
        block: validBlock,
      },
      attachTo: document.body,
    });

    const dialog = document.body.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();
    expect(dialog!.textContent).toContain("Editar bloque");
    const titleInput = document.body.querySelector("input[placeholder='Ej. Gimnasio']") as HTMLInputElement;
    expect(titleInput).not.toBeNull();
    expect(titleInput.value).toBe("Gimnasio");
  });

  it("emite close al hacer click en cancelar", async () => {
    wrapper = mount(WeeklyScheduleModal, {
      props: {
        open: true,
        block: null,
      },
      attachTo: document.body,
    });

    const buttons = Array.from(document.body.querySelectorAll("button"));
    const cancelButton = buttons.find(b => b.textContent?.includes("Cancelar"));
    expect(cancelButton).toBeDefined();
    await cancelButton!.click();
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("llama a deleteBlock y emite close al hacer click en eliminar", async () => {
    wrapper = mount(WeeklyScheduleModal, {
      props: {
        open: true,
        block: validBlock,
      },
      attachTo: document.body,
    });

    const buttons = Array.from(document.body.querySelectorAll("button"));
    const deleteButton = buttons.find(b => b.textContent?.includes("Eliminar"));
    expect(deleteButton).toBeDefined();
    await deleteButton!.click();
    expect(mockStore.deleteBlock).toHaveBeenCalledWith(validBlock.id);
    expect(wrapper.emitted("close")).toBeTruthy();
  });
});
