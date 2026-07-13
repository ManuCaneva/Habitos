import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useCalendarStore } from "./calendar";
import { openUrl } from "@tauri-apps/plugin-opener";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";

vi.stubEnv("VITE_GCAL_CLIENT_ID", "test.apps.googleusercontent.com");

const deepLinkHolder = vi.hoisted(() => ({ cb: null as ((urls: string[]) => void) | null }));
const mockFetch = vi.hoisted(() => vi.fn());
const dbStore = vi.hoisted(() => new Map<string, string | null>());

vi.mock("@/lib/db", () => ({
  saveConfig: vi.fn(async (key: string, value: string) => {
    dbStore.set(key, value);
  }),
  loadConfig: vi.fn(async (key: string) => {
    return dbStore.get(key) ?? null;
  }),
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tauri-apps/plugin-deep-link", () => ({
  onOpenUrl: vi.fn((cb) => {
    deepLinkHolder.cb = cb;
    return vi.fn();
  }),
}));

vi.mock("@tauri-apps/plugin-http", () => ({
  fetch: mockFetch,
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(vi.fn()),
}));

vi.stubGlobal("crypto", {
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) array[i] = i % 256;
    return array;
  },
  subtle: {
    digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
  },
});

describe("useCalendarStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    deepLinkHolder.cb = null;
    mockFetch.mockReset();
    dbStore.clear();
    vi.mocked(onOpenUrl).mockImplementation((async (cb: (urls: string[]) => void) => {
      deepLinkHolder.cb = cb as (urls: string[]) => void;
      return (() => {});
    }) as any);
    vi.mocked(openUrl).mockResolvedValue(undefined);
  });

  it("initial state is disconnected", () => {
    const store = useCalendarStore();
    expect(store.connected).toBe(false);
    expect(store.events).toHaveLength(0);
    expect(store.syncing).toBe(false);
    expect(store.currentYear).toBe(new Date().getFullYear());
  });

  it("connect() opens browser consent URL", async () => {
    const store = useCalendarStore();
    await store.connect();
    expect(deepLinkHolder.cb).toBeTruthy();
  });

  it("connect() throws if VITE_GCAL_CLIENT_ID is empty", async () => {
    vi.stubEnv("VITE_GCAL_CLIENT_ID", "");
    const store = useCalendarStore();
    await expect(store.connect()).rejects.toThrow("client ID not configured");
    vi.stubEnv("VITE_GCAL_CLIENT_ID", "test.apps.googleusercontent.com");
  });

  it("deep-link callback exchanges code and persists tokens", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: "at123",
        refresh_token: "rt123",
        expires_in: 3600,
      }),
    });

    const store = useCalendarStore();
    await store.connect();

    const authUrl = vi.mocked(openUrl).mock.calls[0][0];
    const state = new URL(authUrl).searchParams.get("state");

    await deepLinkHolder.cb!([
      `com.aeon://oauth/callback?code=abc123&state=${state}`,
    ]);

    expect(dbStore.get("gcal_access_token")).toBe("at123");
    expect(dbStore.get("gcal_refresh_token")).toBe("rt123");
    expect(store.connected).toBe(true);
  });

  it("deep-link callback with error does not connect", async () => {
    const store = useCalendarStore();
    await store.connect();

    await deepLinkHolder.cb!([
      "com.aeon://oauth/callback?error=access_denied&state=xyz",
    ]);
    expect(store.connected).toBe(false);
  });

  it("disconnect() clears tokens and state", async () => {
    dbStore.set("gcal_access_token", "at_test");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    const store = useCalendarStore();
    store.connected = true;
    await store.disconnect();

    expect(store.connected).toBe(false);
    expect(store.events).toHaveLength(0);
    expect(dbStore.get("gcal_access_token")).toBe("");
  });

  it("goNextYear() and goPrevYear()", () => {
    const store = useCalendarStore();
    store.currentYear = 2026;
    store.goNextYear();
    expect(store.currentYear).toBe(2027);
    store.goPrevYear();
    expect(store.currentYear).toBe(2026);
  });

  it("syncYear() fetches events for a year", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: "at1",
          refresh_token: "rt1",
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            { id: "primary", backgroundColor: "#7986cb" },
            { id: "secondary", backgroundColor: "#33b679" },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: "e1",
              summary: "Evento 1",
              start: { dateTime: "2026-01-15T10:00:00-03:00" },
              end: { dateTime: "2026-01-15T11:00:00-03:00" },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: "e2",
              summary: "Evento 2",
              start: { date: "2026-02-01" },
              end: { date: "2026-02-02" },
              colorId: "1",
            },
          ],
        }),
      });

    const store = useCalendarStore();
    await store.connect();
    const authUrl = vi.mocked(openUrl).mock.calls[0][0];
    const state = new URL(authUrl).searchParams.get("state");
    await deepLinkHolder.cb!([
      `com.aeon://oauth/callback?code=abc&state=${state}`,
    ]);

    store.currentYear = 2026;
    await store.syncYear(2026);

    expect(store.events).toHaveLength(2);
    expect(store.events[0].date).toBe("2026-01-15");
    expect(store.events[0].color).toBe("#7986cb");
    expect(store.eventsByDate.has("2026-01-15")).toBe(true);
    expect(store.eventsByDate.get("2026-02-01")?.[0].title).toBe("Evento 2");
    expect(store.syncing).toBe(false);
    expect(store.syncError).toBeNull();
  });

  it("loadPersistedConfig restores tokens from DB", async () => {
    dbStore.set("gcal_access_token", "restored_at");
    dbStore.set("gcal_refresh_token", "restored_rt");
    dbStore.set("gcal_token_expiry", "9999999999999");

    const store = useCalendarStore();
    await store.loadPersistedConfig();

    expect(store.connected).toBe(true);
  });

  it("loadPersistedConfig without tokens leaves disconnected", async () => {
    const store = useCalendarStore();
    await store.loadPersistedConfig();
    expect(store.connected).toBe(false);
  });

  it("syncYear() populates calendars ref", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            { id: "primary", summary: "Calendario Principal", primary: true, backgroundColor: "#7986cb" },
            { id: "work", summary: "Trabajo", backgroundColor: "#33b679" },
          ],
        }),
      })
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
      });

    const store = useCalendarStore();
    store.connected = true;
    store.accessToken = "at123";
    
    await store.syncYear(2026);

    expect(store.calendars).toHaveLength(2);
    expect(store.calendars[0].summary).toBe("Calendario Principal");
    expect(store.calendars[1].id).toBe("work");
  });

  it("createEvent() performs POST request and updates store locally", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: "new_evt_abc",
        summary: "Nuevo Evento",
        description: "Una descripción",
        start: { dateTime: "2026-07-22T10:00:00Z" },
        end: { dateTime: "2026-07-22T11:00:00Z" },
        colorId: "2",
      }),
    });

    const store = useCalendarStore();
    store.connected = true;
    store.accessToken = "at123";
    store.events = [];

    await store.createEvent("primary", {
      title: "Nuevo Evento",
      description: "Una descripción",
      start: "2026-07-22T10:00:00Z",
      end: "2026-07-22T11:00:00Z",
      colorId: "2",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer at123",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          summary: "Nuevo Evento",
          description: "Una descripción",
          colorId: "2",
          start: { dateTime: "2026-07-22T10:00:00Z" },
          end: { dateTime: "2026-07-22T11:00:00Z" },
        }),
      })
    );

    expect(store.events).toHaveLength(1);
    expect(store.events[0].id).toBe("new_evt_abc");
    expect(store.events[0].title).toBe("Nuevo Evento");
    expect(store.events[0].description).toBe("Una descripción");
    expect(store.events[0].color).toBe("#33b679"); // colorId "2" resolves to #33b679
  });

  it("updateEvent() performs PUT request and updates local store", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: "evt_edit",
        summary: "Evento Editado",
        description: "Nueva desc",
        start: { dateTime: "2026-07-22T12:00:00Z" },
        end: { dateTime: "2026-07-22T13:00:00Z" },
        colorId: "3",
      }),
    });

    const store = useCalendarStore();
    store.connected = true;
    store.accessToken = "at123";
    store.events = [
      {
        id: "evt_edit",
        title: "Evento Viejo",
        description: "Desc vieja",
        start: "2026-07-22T12:00:00Z",
        end: "2026-07-22T13:00:00Z",
        color: "#7986cb",
        date: "2026-07-22",
        calendarId: "primary",
      },
    ];

    await store.updateEvent("primary", "evt_edit", {
      title: "Evento Editado",
      description: "Nueva desc",
      start: "2026-07-22T12:00:00Z",
      end: "2026-07-22T13:00:00Z",
      colorId: "3",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events/evt_edit",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          summary: "Evento Editado",
          description: "Nueva desc",
          colorId: "3",
          start: { dateTime: "2026-07-22T12:00:00Z" },
          end: { dateTime: "2026-07-22T13:00:00Z" },
        }),
      })
    );

    expect(store.events).toHaveLength(1);
    expect(store.events[0].title).toBe("Evento Editado");
    expect(store.events[0].description).toBe("Nueva desc");
    expect(store.events[0].color).toBe("#8e24aa"); // colorId "3" resolves to #8e24aa
  });

  it("deleteEvent() performs DELETE request and removes event from store", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const store = useCalendarStore();
    store.connected = true;
    store.accessToken = "at123";
    store.events = [
      {
        id: "evt_del",
        title: "A borrar",
        start: "2026-07-22T12:00:00Z",
        end: "2026-07-22T13:00:00Z",
        color: "#7986cb",
        date: "2026-07-22",
        calendarId: "primary",
      },
    ];

    await store.deleteEvent("primary", "evt_del");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events/evt_del",
      expect.objectContaining({
        method: "DELETE",
      })
    );

    expect(store.events).toHaveLength(0);
  });

  it("supports local event creation when disconnected or using calendarId 'local'", async () => {
    const store = useCalendarStore();
    store.connected = false; // Disconnected

    await store.createEvent("local", {
      title: "Local Event 1",
      description: "Local Desc",
      start: "2026-07-22T10:00:00Z",
      end: "2026-07-22T11:00:00Z",
      colorId: "2",
    });

    // Should not call Google Calendar API
    expect(mockFetch).not.toHaveBeenCalled();

    // Event should be added to store
    expect(store.events).toHaveLength(1);
    expect(store.events[0].title).toBe("Local Event 1");
    expect(store.events[0].calendarId).toBe("local");
    expect(store.events[0].color).toBe("#33b679"); // colorId "2"

    // Check configuration was saved
    const saved = dbStore.get("local-calendar-events");
    expect(saved).toBeTruthy();
    expect(JSON.parse(saved!)).toHaveLength(1);
    expect(JSON.parse(saved!)[0].title).toBe("Local Event 1");
  });

  it("supports local event update", async () => {
    const store = useCalendarStore();
    store.connected = false;
    
    // Seed a local event
    const initialEvent = {
      id: "local_123",
      title: "Local Event 1",
      description: "Local Desc",
      start: "2026-07-22T10:00:00Z",
      end: "2026-07-22T11:00:00Z",
      color: "#33b679",
      date: "2026-07-22",
      calendarId: "local",
    };
    dbStore.set("local-calendar-events", JSON.stringify([initialEvent]));
    await store.syncYear(2026);

    await store.updateEvent("local", "local_123", {
      title: "Local Event Updated",
      description: "New Local Desc",
      start: "2026-07-22T12:00:00Z",
      end: "2026-07-22T13:00:00Z",
      colorId: "3",
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(store.events).toHaveLength(1);
    expect(store.events[0].title).toBe("Local Event Updated");
    expect(store.events[0].color).toBe("#8e24aa"); // colorId "3"

    const saved = dbStore.get("local-calendar-events");
    expect(JSON.parse(saved!)[0].title).toBe("Local Event Updated");
  });

  it("supports local event deletion", async () => {
    const store = useCalendarStore();
    store.connected = false;
    
    const initialEvent = {
      id: "local_123",
      title: "Local Event 1",
      color: "#33b679",
      date: "2026-07-22",
      calendarId: "local",
      start: "2026-07-22T10:00:00Z",
      end: "2026-07-22T11:00:00Z",
    };
    dbStore.set("local-calendar-events", JSON.stringify([initialEvent]));
    await store.syncYear(2026);

    await store.deleteEvent("local", "local_123");

    expect(mockFetch).not.toHaveBeenCalled();
    expect(store.events).toHaveLength(0);

    const saved = dbStore.get("local-calendar-events");
    expect(JSON.parse(saved!)).toHaveLength(0);
  });

  it("syncYear() loads local events when disconnected", async () => {
    const store = useCalendarStore();
    store.connected = false;

    const initialEvent = {
      id: "local_123",
      title: "Local Event 1",
      color: "#33b679",
      date: "2026-07-22",
      calendarId: "local",
      start: "2026-07-22T10:00:00Z",
      end: "2026-07-22T11:00:00Z",
    };
    dbStore.set("local-calendar-events", JSON.stringify([initialEvent]));

    await store.syncYear(2026);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(store.events).toHaveLength(1);
    expect(store.events[0].title).toBe("Local Event 1");
  });
});
