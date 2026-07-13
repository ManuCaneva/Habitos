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
});
