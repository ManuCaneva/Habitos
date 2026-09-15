import { describe, it, expect } from 'vitest'
import {
  CalendarEventSchema,
  GcalEventApiResponseSchema,
  GcalVisibleCalendarsSchema,
  DEFAULT_GCAL_VISIBLE_CALENDARS,
  parseGcalVisibleCalendarsJson,
  resolveEventColor,
  type CalendarEvent,
} from './calendar'

describe('CalendarEventSchema', () => {
  it('acepta un evento válido', () => {
    const event: CalendarEvent = {
      id: 'evt123',
      date: '2026-01-15',
      title: 'Team standup',
      color: '#7986cb',
      calendarId: 'primary',
      start: '2026-01-15T10:00:00-03:00',
      end: '2026-01-15T10:30:00-03:00',
      description: 'Daily sync meeting',
    }
    const result = CalendarEventSchema.parse(event)
    expect(result.id).toBe('evt123')
    expect(result.date).toBe('2026-01-15')
    expect(result.description).toBe('Daily sync meeting')
  })

  it('rechaza date con formato incorrecto', () => {
    expect(() =>
      CalendarEventSchema.parse({
        id: 'evt1',
        date: '15-01-2026',
        title: 'Test',
        color: '#7986cb',
        calendarId: 'primary',
        start: '2026-01-15T10:00:00Z',
        end: '2026-01-15T10:30:00Z',
      })
    ).toThrow()
  })
})

describe('GcalVisibleCalendarsSchema', () => {
  it('parsea una preferencia válida con ids ocultos', () => {
    const result = GcalVisibleCalendarsSchema.parse({
      hiddenCalendarIds: ['work', 'utn-asignaturas'],
    })
    expect(result.hiddenCalendarIds).toEqual(['work', 'utn-asignaturas'])
  })

  it('usa default [] cuando falta el campo', () => {
    const result = GcalVisibleCalendarsSchema.parse({})
    expect(result.hiddenCalendarIds).toEqual([])
  })

  it('rechaza tipos incorrectos', () => {
    expect(() => GcalVisibleCalendarsSchema.parse({ hiddenCalendarIds: 'work' })).toThrow()
    expect(() => GcalVisibleCalendarsSchema.parse({ hiddenCalendarIds: [123] })).toThrow()
  })

  it('parseGcalVisibleCalendarsJson devuelve default ante JSON corrupto', () => {
    expect(parseGcalVisibleCalendarsJson('{no-json')).toEqual(DEFAULT_GCAL_VISIBLE_CALENDARS)
    expect(parseGcalVisibleCalendarsJson(null)).toEqual(DEFAULT_GCAL_VISIBLE_CALENDARS)
    expect(parseGcalVisibleCalendarsJson(undefined)).toEqual(DEFAULT_GCAL_VISIBLE_CALENDARS)
  })

  it('parseGcalVisibleCalendarsJson devuelve default ante shape válido pero tipos inválidos', () => {
    expect(parseGcalVisibleCalendarsJson(JSON.stringify({ hiddenCalendarIds: 42 }))).toEqual(
      DEFAULT_GCAL_VISIBLE_CALENDARS
    )
  })

  it('parseGcalVisibleCalendarsJson parsea una preferencia persistida válida', () => {
    const raw = JSON.stringify({ hiddenCalendarIds: ['work'] })
    expect(parseGcalVisibleCalendarsJson(raw)).toEqual({ hiddenCalendarIds: ['work'] })
  })

  it('los fallbacks devuelven arrays nuevos sin compartir referencia con el default', () => {
    const a = parseGcalVisibleCalendarsJson(null)
    const b = parseGcalVisibleCalendarsJson('{no-json')
    const c = parseGcalVisibleCalendarsJson('{}')
    for (const result of [a, b, c]) {
      expect(result.hiddenCalendarIds).toEqual([])
      expect(result.hiddenCalendarIds).not.toBe(DEFAULT_GCAL_VISIBLE_CALENDARS.hiddenCalendarIds)
    }
    a.hiddenCalendarIds.push('work')
    expect(DEFAULT_GCAL_VISIBLE_CALENDARS.hiddenCalendarIds).toEqual([])
  })
})

describe('GcalEventApiResponseSchema', () => {
  const apiResponse = {
    items: [
      {
        id: 'evt1',
        summary: 'Reunión',
        start: { dateTime: '2026-01-15T10:00:00-03:00' },
        end: { dateTime: '2026-01-15T11:00:00-03:00' },
        colorId: '1',
        description: 'Reunión de coordinación del equipo',
      },
      {
        id: 'evt2',
        summary: 'Feriado',
        start: { date: '2026-01-01' },
        end: { date: '2026-01-02' },
      },
    ],
  }

  it('parsea una respuesta típica de Google Calendar API', () => {
    const result = GcalEventApiResponseSchema.parse(apiResponse)
    expect(result.items).toHaveLength(2)
    expect(result.items[0].id).toBe('evt1')
    expect(result.items[0].summary).toBe('Reunión')
    expect(result.items[0].description).toBe('Reunión de coordinación del equipo')
    expect(result.items[1].id).toBe('evt2')
  })

  it('tolera items sin colorId', () => {
    const result = GcalEventApiResponseSchema.parse(apiResponse)
    expect(result.items[0].colorId).toBe('1')
    expect(result.items[1].colorId).toBeUndefined()
  })
})

describe('resolveEventColor', () => {
  it('prioriza el colorId sobre el color del calendario', () => {
    expect(resolveEventColor('1', '#123456')).toBe('#7986cb')
  })

  it('usa el color del calendario cuando no hay colorId', () => {
    expect(resolveEventColor(undefined, '#abcdef')).toBe('#abcdef')
  })

  it('cae al violeta Attio cuando no hay colorId ni color de calendario', () => {
    expect(resolveEventColor(undefined, undefined)).toBe('#6e56cf')
  })
})
