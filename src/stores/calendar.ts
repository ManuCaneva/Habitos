import { defineStore } from "pinia";
import { ref, computed, onUnmounted } from "vue";
import { saveConfig, loadConfig } from "@/lib/db";
import {
  generatePkce,
  buildAuthUrl,
  parseRedirectUri,
  buildTokenExchangePayload,
  buildRefreshPayload,
} from "@/lib/googleOauth";
import {
  buildEventsListUrl,
  buildCalendarListUrl,
  mapGcalEventsToDomain,
  mapCalendarListToColors,
} from "@/lib/googleCalendar";
import {
  GcalEventApiResponseSchema,
  type CalendarEvent,
  CALENDAR_COLORS,
} from "@/schemas/calendar";
import { yearBounds } from "@/lib/calendarDates";
import { openUrl } from "@tauri-apps/plugin-opener";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { fetch } from "@tauri-apps/plugin-http";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const GCAL_ACCESS_TOKEN = "gcal_access_token";
const GCAL_REFRESH_TOKEN = "gcal_refresh_token";
const GCAL_TOKEN_EXPIRY = "gcal_token_expiry";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPES = "https://www.googleapis.com/auth/calendar";

let _pendingState: { verifier: string; state: string } | null = null;
let _unlisten: (() => void) | null = null;

export const useCalendarStore = defineStore("calendar", () => {
  const connected = ref(false);
  const currentYear = ref(new Date().getFullYear());
  const syncing = ref(false);
  const syncError = ref<string | null>(null);
  const events = ref<CalendarEvent[]>([]);
  const localEvents = ref<CalendarEvent[]>([]);
  const calendars = ref<{ id: string; summary: string; primary?: boolean; backgroundColor?: string }[]>([]);

  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const tokenExpiry = ref<number | null>(null);

  const eventsByDate = computed(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events.value) {
      if (!map.has(event.date)) map.set(event.date, []);
      map.get(event.date)!.push(event);
    }
    return map;
  });

  function getClientId(): string {
    return import.meta.env.VITE_GCAL_CLIENT_ID ?? "";
  }

  function getClientSecret(): string {
    return import.meta.env.VITE_GCAL_CLIENT_SECRET ?? "";
  }

  function getRedirectUri(): string {
    if (import.meta.env.DEV) {
      return "http://localhost:14202/oauth-callback";
    }
    return "com.aeon://oauth/callback";
  }

  async function ensureAccessToken(): Promise<string> {
    if (!accessToken.value) throw new Error("Not connected");
    if (tokenExpiry.value && Date.now() >= tokenExpiry.value) {
      await refreshAccessToken();
    }
    return accessToken.value!;
  }

  async function refreshAccessToken(): Promise<void> {
    if (!refreshToken.value) {
      connected.value = false;
      await clearTokens();
      throw new Error("Session expired. Please reconnect.");
    }
    const clientId = getClientId();
    const clientSecret = getClientSecret();
    const body = buildRefreshPayload({
      refreshToken: refreshToken.value,
      clientId,
      clientSecret,
    });
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      connected.value = false;
      await clearTokens();
      throw new Error(data.error_description ?? "Token refresh failed");
    }
    accessToken.value = data.access_token;
    tokenExpiry.value = Date.now() + (data.expires_in ?? 3600) * 1000;
    await persistTokens();
  }

  async function persistTokens(): Promise<void> {
    await Promise.all([
      saveConfig(GCAL_ACCESS_TOKEN, accessToken.value ?? ""),
      saveConfig(GCAL_REFRESH_TOKEN, refreshToken.value ?? ""),
      saveConfig(GCAL_TOKEN_EXPIRY, String(tokenExpiry.value ?? "")),
    ]);
  }

  async function clearTokens(): Promise<void> {
    accessToken.value = null;
    refreshToken.value = null;
    tokenExpiry.value = null;
    await Promise.all([
      saveConfig(GCAL_ACCESS_TOKEN, ""),
      saveConfig(GCAL_REFRESH_TOKEN, ""),
      saveConfig(GCAL_TOKEN_EXPIRY, ""),
    ]);
  }

  async function connect(): Promise<void> {
    const clientId = getClientId();
    if (!clientId) {
      throw new Error("Google Calendar client ID not configured");
    }
    const { verifier, challenge } = await generatePkce();
    const state = verifier.slice(0, 16);
    _pendingState = { verifier, state };

    if (import.meta.env.DEV) {
      await invoke("start_oauth_server");
    }

    const authUrl = buildAuthUrl({
      clientId,
      redirectUri: getRedirectUri(),
      scope: SCOPES,
      state,
      codeChallenge: challenge,
    });

    await openUrl(authUrl);
  }

  async function exchangeCode(
    code: string,
    expectedState: string,
  ): Promise<void> {
    if (!_pendingState || _pendingState.state !== expectedState) {
      throw new Error("OAuth state mismatch");
    }
    const { verifier } = _pendingState;
    _pendingState = null;

    const clientId = getClientId();
    const clientSecret = getClientSecret();
    const body = buildTokenExchangePayload({
      code,
      clientId,
      clientSecret,
      redirectUri: getRedirectUri(),
      codeVerifier: verifier,
    });

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        `Google API Error: ${data.error_description || data.error || JSON.stringify(data)}`
      );
    }

    accessToken.value = data.access_token;
    refreshToken.value = data.refresh_token ?? null;
    tokenExpiry.value = Date.now() + (data.expires_in ?? 3600) * 1000;
    connected.value = true;
    await persistTokens();
  }

  async function exchangeCodeDirect(code: string): Promise<void> {
    if (!_pendingState) {
      throw new Error("Por favor, hacé clic en 'Conectar' antes de ingresar el código.");
    }
    const { verifier } = _pendingState;
    _pendingState = null;

    const clientId = getClientId();
    const clientSecret = getClientSecret();
    const body = buildTokenExchangePayload({
      code,
      clientId,
      clientSecret,
      redirectUri: getRedirectUri(),
      codeVerifier: verifier,
    });

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        `Google API Error: ${data.error_description || data.error || JSON.stringify(data)}`
      );
    }

    accessToken.value = data.access_token;
    refreshToken.value = data.refresh_token ?? null;
    tokenExpiry.value = Date.now() + (data.expires_in ?? 3600) * 1000;
    connected.value = true;
    await persistTokens();
  }

  async function disconnect(): Promise<void> {
    if (accessToken.value) {
      try {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${accessToken.value}`,
          { method: "POST" },
        );
      } catch {}
    }
    await clearTokens();
    connected.value = false;
    events.value = [];
  }

  async function syncYear(year?: number): Promise<void> {
    const y = year ?? currentYear.value;
    syncing.value = true;
    syncError.value = null;
    try {
      const localJson = await loadConfig("local-calendar-events");
      if (localJson) {
        try {
          localEvents.value = JSON.parse(localJson);
        } catch {
          localEvents.value = [];
        }
      } else {
        localEvents.value = [];
      }

      if (!connected.value) {
        events.value = [...localEvents.value].sort((a, b) => a.date.localeCompare(b.date));
        return;
      }

      const token = await ensureAccessToken();

      const calRes = await fetch(buildCalendarListUrl(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!calRes.ok) {
        throw new Error("Failed to fetch calendars");
      }
      const calData = await calRes.json();
      calendars.value = calData.items ?? [];
      const calendarColors = mapCalendarListToColors(calData.items ?? []);
      const calendarIds: string[] = (calData.items ?? []).map(
        (c: { id: string }) => c.id,
      );

      const { start, end } = yearBounds(y);
      const allEvents: CalendarEvent[] = [];

      await Promise.all(
        calendarIds.map(async (cid: string) => {
          try {
             const evRes = await fetch(buildEventsListUrl(cid, start, end), {
               headers: { Authorization: `Bearer ${token}` },
             });
             if (!evRes.ok) return;
             const raw = await evRes.json();
             const evData = GcalEventApiResponseSchema.parse(raw);
             const calColor = calendarColors.get(cid) ?? "#5e6ad2";
             const mapped = mapGcalEventsToDomain(evData.items, cid, calColor);
             allEvents.push(...mapped);
          } catch {}
        }),
      );

      allEvents.push(...localEvents.value);
      allEvents.sort((a, b) => a.date.localeCompare(b.date));
      events.value = allEvents;
    } catch (e) {
      syncError.value = e instanceof Error ? e.message : "Sync failed";
      throw e;
    } finally {
      syncing.value = false;
    }
  }

  function goNextYear(): void {
    currentYear.value++;
  }

  function goPrevYear(): void {
    currentYear.value--;
  }

  async function loadPersistedConfig(): Promise<void> {
    const [at, rt, exp, localJson] = await Promise.all([
      loadConfig(GCAL_ACCESS_TOKEN),
      loadConfig(GCAL_REFRESH_TOKEN),
      loadConfig(GCAL_TOKEN_EXPIRY),
      loadConfig("local-calendar-events"),
    ]);
    if (localJson) {
      try {
        localEvents.value = JSON.parse(localJson);
      } catch {}
    }
    if (at && rt) {
      accessToken.value = at;
      refreshToken.value = rt;
      tokenExpiry.value = exp ? Number(exp) : null;
      connected.value = true;
    }
  }

  async function initDeepLink(): Promise<void> {
    try {
      _unlisten = await onOpenUrl(async (urls: string[]) => {
        if (!_pendingState || urls.length === 0) return;
        const { code, error, state } = parseRedirectUri(urls[0]);
        if (error) {
          _pendingState = null;
          syncError.value = `OAuth error: ${error}`;
          return;
        }
        if (code && state && _pendingState.state === state) {
          try {
            await exchangeCode(code, state);
          } catch (e: any) {
            console.error("Deep link token exchange failed:", e);
            syncError.value = e?.message || String(e);
          }
        }
      });
    } catch {}
  }

  let _unlistenOauth: (() => void) | null = null;

  async function initTauriEvent(): Promise<void> {
    try {
      _unlistenOauth = await listen<{ code: string; state: string }>("oauth-callback", async (event) => {
        const { code, state } = event.payload;
        if (code && state && _pendingState && _pendingState.state === state) {
          try {
            await exchangeCode(code, state);
          } catch (e: any) {
            console.error("Tauri event token exchange failed:", e);
            syncError.value = e?.message || String(e);
          }
        }
      });
    } catch {}
  }

  initDeepLink();
  initTauriEvent();
  loadPersistedConfig();

  onUnmounted(() => {
    _unlisten?.();
    _unlisten = null;
    _unlistenOauth?.();
    _unlistenOauth = null;
  });

  async function createEvent(
    calendarId: string,
    eventData: { title: string; description?: string; colorId?: string; start: string; end: string },
  ): Promise<void> {
    syncing.value = true;
    syncError.value = null;
    try {
      if (calendarId === "local" || !connected.value) {
        const eventId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const calendarColor = eventData.colorId ? (CALENDAR_COLORS[eventData.colorId] ?? "#5e6ad2") : "#5e6ad2";
        
        const newEvent: CalendarEvent = {
          id: eventId,
          date: eventData.start.split("T")[0],
          title: eventData.title,
          description: eventData.description,
          color: calendarColor,
          calendarId: "local",
          start: eventData.start,
          end: eventData.end,
        };
        
        localEvents.value.push(newEvent);
        await saveConfig("local-calendar-events", JSON.stringify(localEvents.value));
        
        events.value = [...events.value, newEvent].sort((a, b) => a.date.localeCompare(b.date));
        return;
      }

      const token = await ensureAccessToken();
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
      
      const body = {
        summary: eventData.title,
        description: eventData.description,
        colorId: eventData.colorId,
        start: { dateTime: eventData.start },
        end: { dateTime: eventData.end },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create event");
      }

      const calendarColor = calendars.value.find(c => c.id === calendarId)?.backgroundColor ?? "#5e6ad2";
      const mapped = mapGcalEventsToDomain([data], calendarId, calendarColor)[0];
      events.value = [...events.value, mapped].sort((a, b) => a.date.localeCompare(b.date));
    } catch (e: any) {
      syncError.value = e?.message || "Failed to create event";
      throw e;
    } finally {
      syncing.value = false;
    }
  }

  async function updateEvent(
    calendarId: string,
    eventId: string,
    eventData: { title: string; description?: string; colorId?: string; start: string; end: string },
  ): Promise<void> {
    syncing.value = true;
    syncError.value = null;
    try {
      if (calendarId === "local" || eventId.startsWith("local_")) {
        const calendarColor = eventData.colorId ? (CALENDAR_COLORS[eventData.colorId] ?? "#5e6ad2") : "#5e6ad2";
        localEvents.value = localEvents.value.map(evt => {
          if (evt.id === eventId) {
            return {
              ...evt,
              title: eventData.title,
              description: eventData.description,
              color: calendarColor,
              start: eventData.start,
              end: eventData.end,
              date: eventData.start.split("T")[0],
            };
          }
          return evt;
        });
        await saveConfig("local-calendar-events", JSON.stringify(localEvents.value));
        
        events.value = events.value.map(evt => {
          if (evt.id === eventId) {
            return {
              ...evt,
              title: eventData.title,
              description: eventData.description,
              color: calendarColor,
              start: eventData.start,
              end: eventData.end,
              date: eventData.start.split("T")[0],
            };
          }
          return evt;
        }).sort((a, b) => a.date.localeCompare(b.date));
        return;
      }

      const token = await ensureAccessToken();
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
      
      const body = {
        summary: eventData.title,
        description: eventData.description,
        colorId: eventData.colorId,
        start: { dateTime: eventData.start },
        end: { dateTime: eventData.end },
      };

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update event");
      }

      const calendarColor = calendars.value.find(c => c.id === calendarId)?.backgroundColor ?? "#5e6ad2";
      const mapped = mapGcalEventsToDomain([data], calendarId, calendarColor)[0];
      events.value = events.value.map(evt => evt.id === eventId ? mapped : evt).sort((a, b) => a.date.localeCompare(b.date));
    } catch (e: any) {
      syncError.value = e?.message || "Failed to update event";
      throw e;
    } finally {
      syncing.value = false;
    }
  }

  async function deleteEvent(calendarId: string, eventId: string): Promise<void> {
    syncing.value = true;
    syncError.value = null;
    try {
      if (calendarId === "local" || eventId.startsWith("local_")) {
        localEvents.value = localEvents.value.filter(evt => evt.id !== eventId);
        await saveConfig("local-calendar-events", JSON.stringify(localEvents.value));
        events.value = events.value.filter(evt => evt.id !== eventId);
        return;
      }

      const token = await ensureAccessToken();
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
      
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || "Failed to delete event");
      }

      events.value = events.value.filter(evt => evt.id !== eventId);
    } catch (e: any) {
      syncError.value = e?.message || "Failed to delete event";
      throw e;
    } finally {
      syncing.value = false;
    }
  }

  return {
    connected,
    currentYear,
    syncing,
    syncError,
    events,
    eventsByDate,
    connect,
    disconnect,
    syncYear,
    goNextYear,
    goPrevYear,
    loadPersistedConfig,
    exchangeCodeDirect,
    accessToken,
    refreshToken,
    tokenExpiry,
    calendars,
    createEvent,
    updateEvent,
    deleteEvent,
  };
});
