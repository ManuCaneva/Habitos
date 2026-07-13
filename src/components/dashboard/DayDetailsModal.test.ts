import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, DOMWrapper } from "@vue/test-utils";
import DayDetailsModal from "./DayDetailsModal.vue";
import { createPinia, setActivePinia } from "pinia";
import { ref, reactive } from "vue";
import TimePicker from "@/components/ui/TimePicker.vue";

const mockStore = {
  connected: ref(true),
  syncing: ref(false),
  syncError: ref<string | null>(null),
  events: ref<any[]>([]),
  calendars: ref<any[]>([]),
  createEvent: vi.fn().mockResolvedValue(undefined),
  updateEvent: vi.fn().mockResolvedValue(undefined),
  deleteEvent: vi.fn().mockResolvedValue(undefined),
};

const reactiveMockStore = reactive(mockStore);

vi.mock("@/stores/calendar", () => ({
  useCalendarStore: () => reactiveMockStore,
}));

describe("DayDetailsModal", () => {
  let wrapper: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    mockStore.events.value = [
      {
        id: "evt1",
        date: "2026-07-22",
        title: "Evento Test 1",
        description: "Descripción Test 1",
        color: "#7986cb",
        calendarId: "primary",
        start: "2026-07-22T10:00:00-03:00",
        end: "2026-07-22T11:00:00-03:00",
      },
    ];
    
    mockStore.calendars.value = [
      { id: "primary", summary: "Principal", primary: true, backgroundColor: "#7986cb" },
      { id: "work", summary: "Trabajo", backgroundColor: "#33b679" },
    ];
    
    mockStore.syncError.value = null;
    mockStore.createEvent.mockReset().mockResolvedValue(undefined);
    mockStore.updateEvent.mockReset().mockResolvedValue(undefined);
    mockStore.deleteEvent.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    document.body.innerHTML = "";
  });

  const factory = (props = {}) => {
    wrapper = mount(DayDetailsModal, {
      props: {
        open: true,
        date: "2026-07-22",
        ...props,
      },
      attachTo: document.body,
    });
    return wrapper;
  };

  it("renders when open and displays title date", () => {
    factory();
    const dialog = document.body.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();
    expect(dialog!.textContent!.toLowerCase()).toContain("22 de julio");
  });

  it("renders the list of events for the day", () => {
    factory();
    const dialog = document.body.querySelector("[role='dialog']");
    expect(dialog!.textContent).toContain("Evento Test 1");
    expect(dialog!.textContent).toContain("Descripción Test 1");
  });

  it("renders empty state message when no events on that day", () => {
    mockStore.events.value = [];
    factory();
    const dialog = document.body.querySelector("[role='dialog']");
    expect(dialog!.textContent).toContain("No hay eventos");
  });

  it("toggles to create form when clicking 'Agregar Evento'", async () => {
    factory();
    const btn = document.body.querySelector("[data-testid='add-event-btn']") as HTMLElement;
    expect(btn).not.toBeNull();
    await btn.click();
    
    expect(document.body.querySelector("[data-testid='event-title-input'] input")).not.toBeNull();
    expect(document.body.querySelector("[data-testid='calendar-select']")).not.toBeNull();
  });

  it("submits the create event form successfully", async () => {
    factory();
    
    // Toggle form
    const btn = document.body.querySelector("[data-testid='add-event-btn']") as HTMLElement;
    await btn.click();
    await wrapper.vm.$nextTick();
    
    // Fill values
    const titleInput = document.body.querySelector("[data-testid='event-title-input'] input") as HTMLInputElement;
    const descInput = document.body.querySelector("[data-testid='event-desc-input'] textarea") as HTMLTextAreaElement;
    const calSelect = document.body.querySelector("[data-testid='calendar-select']") as HTMLSelectElement;
    
    await new DOMWrapper(titleInput).setValue("Nuevo Evento Creado");
    await new DOMWrapper(descInput).setValue("Desc Creada");
    await new DOMWrapper(calSelect).setValue("primary");
    
    const pickers = wrapper.findAllComponents(TimePicker);
    await pickers[0].vm.$emit("update:modelValue", "10:00");
    await pickers[1].vm.$emit("update:modelValue", "11:30");
    
    await wrapper.vm.$nextTick();
    
    // Save
    const saveBtn = document.body.querySelector("[data-testid='save-event-btn']") as HTMLElement;
    await saveBtn.click();
    await wrapper.vm.$nextTick();
    
    expect(mockStore.createEvent).toHaveBeenCalledWith("primary", expect.objectContaining({
      title: "Nuevo Evento Creado",
      description: "Desc Creada",
      colorId: undefined, // default
    }));
  });

  it("shows edit form with prepopulated values, updates, and deletes", async () => {
    factory();
    
    // Click edit on the event
    const editBtn = document.body.querySelector("[data-testid='edit-event-btn']") as HTMLElement;
    await editBtn.click();
    await wrapper.vm.$nextTick();
    
    // Check values
    const titleInput = document.body.querySelector("[data-testid='event-title-input'] input") as HTMLInputElement;
    expect(titleInput.value).toBe("Evento Test 1");
    
    // Modify and update
    await new DOMWrapper(titleInput).setValue("Evento Modificado");
    await wrapper.vm.$nextTick();
    
    const saveBtn = document.body.querySelector("[data-testid='save-event-btn']") as HTMLElement;
    await saveBtn.click();
    await wrapper.vm.$nextTick();
    
    expect(mockStore.updateEvent).toHaveBeenCalledWith(
      "primary",
      "evt1",
      expect.objectContaining({
        title: "Evento Modificado",
      })
    );

    // Re-open and delete
    await editBtn.click();
    await wrapper.vm.$nextTick();
    
    const deleteBtn = document.body.querySelector("[data-testid='delete-event-btn']") as HTMLElement;
    await deleteBtn.click();
    await wrapper.vm.$nextTick();
    
    expect(mockStore.deleteEvent).toHaveBeenCalledWith("primary", "evt1");
  });
});
