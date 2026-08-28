import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  useWeeklyScheduleStore,
  minutesToHHMM,
  hhmmToMinutes,
  snapToSlot,
  overlaps,
} from './weeklySchedule'
import * as db from '@/lib/db'

vi.mock('@/lib/db', () => ({
  listScheduleBlocks: vi.fn().mockResolvedValue([]),
  listScheduleSlots: vi.fn().mockResolvedValue([]),
  createScheduleBlock: vi.fn(),
  createScheduleSlot: vi.fn(),
  updateScheduleBlock: vi.fn(),
  updateScheduleSlot: vi.fn(),
  deleteScheduleBlock: vi.fn(),
  deleteScheduleSlot: vi.fn(),
  loadWeeklyScheduleSettings: vi.fn().mockResolvedValue({
    granularity_minutes: 30,
    day_start_minutes: 360,
    day_end_minutes: 1380,
    week_starts_monday: true,
  }),
  saveWeeklyScheduleSettings: vi.fn(),
}))

const validUuid = '550e8400-e29b-41d4-a716-446655440000'
const validIso = '2026-07-12T19:00:00.000Z'

describe('weeklySchedule store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('HH:MM y minutos conversions', () => {
    it('convierte minutos a string HH:MM', () => {
      expect(minutesToHHMM(0)).toBe('00:00')
      expect(minutesToHHMM(360)).toBe('06:00')
      expect(minutesToHHMM(1439)).toBe('23:59')
    })

    it('convierte string HH:MM a minutos', () => {
      expect(hhmmToMinutes('00:00')).toBe(0)
      expect(hhmmToMinutes('06:00')).toBe(360)
      expect(hhmmToMinutes('23:59')).toBe(1439)
    })

    it('lanza error con HH:MM inválidos', () => {
      expect(() => hhmmToMinutes('invalid')).toThrow()
      expect(() => hhmmToMinutes('25:00')).toThrow()
      expect(() => hhmmToMinutes('12:60')).toThrow()
    })
  })

  describe('snapToSlot', () => {
    it('ajusta minutos a la granularidad indicada', () => {
      expect(snapToSlot(45, 30)).toBe(30)
      expect(snapToSlot(59, 30)).toBe(30)
      expect(snapToSlot(60, 30)).toBe(60)
      expect(snapToSlot(14, 15)).toBe(0)
      expect(snapToSlot(15, 15)).toBe(15)
    })
  })

  describe('overlaps', () => {
    it('detecta solapamientos', () => {
      expect(
        overlaps({ start_minutes: 360, end_minutes: 420 }, { start_minutes: 390, end_minutes: 450 })
      ).toBe(true)

      expect(
        overlaps({ start_minutes: 360, end_minutes: 420 }, { start_minutes: 420, end_minutes: 480 })
      ).toBe(false)

      expect(
        overlaps({ start_minutes: 360, end_minutes: 480 }, { start_minutes: 390, end_minutes: 420 })
      ).toBe(true)
    })
  })

  describe('Lógica del Store', () => {
    it('carga bloques con sus slots', async () => {
      const store = useWeeklyScheduleStore()
      const mockBlockRow = {
        id: validUuid,
        title: 'Redes de datos',
        color: 'cyan',
        sort_order: 0,
        created_at: validIso,
        updated_at: validIso,
      }
      const mockSlotRows = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          block_id: validUuid,
          day_of_week: 1,
          start_minutes: 995,
          end_minutes: 1230,
          created_at: validIso,
          updated_at: validIso,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          block_id: validUuid,
          day_of_week: 3,
          start_minutes: 1230,
          end_minutes: 1365,
          created_at: validIso,
          updated_at: validIso,
        },
      ]
      vi.mocked(db.listScheduleBlocks).mockResolvedValue([mockBlockRow])
      vi.mocked(db.listScheduleSlots).mockResolvedValue(mockSlotRows)

      await store.loadAll()

      expect(store.blocksWithSlots).toHaveLength(1)
      expect(store.blocksWithSlots[0].title).toBe('Redes de datos')
      expect(store.blocksWithSlots[0].slots).toHaveLength(2)
      expect(store.blocksWithSlots[0].slots[0].day_of_week).toBe(1)
      expect(store.blocksWithSlots[0].slots[1].day_of_week).toBe(3)
      expect(store.settings.granularity_minutes).toBe(30)
    })

    it('crea un bloque con slots si no hay solapamiento', async () => {
      const store = useWeeklyScheduleStore()
      const mockBlockRow = {
        id: validUuid,
        title: 'Estudio',
        color: 'green',
        sort_order: 0,
        created_at: validIso,
        updated_at: validIso,
      }
      const mockSlotRow = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        block_id: validUuid,
        day_of_week: 1,
        start_minutes: 480,
        end_minutes: 540,
        created_at: validIso,
        updated_at: validIso,
      }
      vi.mocked(db.createScheduleBlock).mockResolvedValue(mockBlockRow)
      vi.mocked(db.createScheduleSlot).mockResolvedValue(mockSlotRow)

      const blockDraft = {
        title: 'Estudio',
        color: 'green' as const,
        sort_order: 0,
      }
      const slotsDraft = [{ day_of_week: 1, start_minutes: 480, end_minutes: 540 }]

      const block = await store.createBlock(blockDraft, slotsDraft)

      expect(block.id).toBe(validUuid)
      expect(block.title).toBe('Estudio')
      expect(block.slots).toHaveLength(1)
      expect(store.blocksWithSlots).toContainEqual(block)
      expect(db.createScheduleBlock).toHaveBeenCalledTimes(1)
      expect(db.createScheduleSlot).toHaveBeenCalledTimes(1)
    })

    it('rechaza la creación si un slot se solapa', async () => {
      const store = useWeeklyScheduleStore()
      store.blocksWithSlots = [
        {
          id: '333e8400-e29b-41d4-a716-446655440000',
          title: 'Gimnasio',
          color: 'lavender',
          sort_order: 0,
          created_at: validIso,
          updated_at: validIso,
          slots: [
            {
              id: '333e8400-e29b-41d4-a716-446655440001',
              block_id: '333e8400-e29b-41d4-a716-446655440000',
              day_of_week: 1,
              start_minutes: 480,
              end_minutes: 540,
              created_at: validIso,
              updated_at: validIso,
            },
          ],
        },
      ]

      const blockDraft = {
        title: 'Estudio',
        color: 'green' as const,
        sort_order: 0,
      }
      const slotsDraft = [{ day_of_week: 1, start_minutes: 500, end_minutes: 560 }]

      await expect(store.createBlock(blockDraft, slotsDraft)).rejects.toThrow('solapa')
      expect(db.createScheduleBlock).not.toHaveBeenCalled()
    })

    it('agrega un slot a un bloque existente', async () => {
      const store = useWeeklyScheduleStore()
      store.blocksWithSlots = [
        {
          id: validUuid,
          title: 'Gimnasio',
          color: 'lavender',
          sort_order: 0,
          created_at: validIso,
          updated_at: validIso,
          slots: [],
        },
      ]

      const mockSlotRow = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        block_id: validUuid,
        day_of_week: 2,
        start_minutes: 600,
        end_minutes: 660,
        created_at: validIso,
        updated_at: validIso,
      }
      vi.mocked(db.createScheduleSlot).mockResolvedValue(mockSlotRow)

      const slotDraft = { day_of_week: 2, start_minutes: 600, end_minutes: 660 }
      const slot = await store.addSlot(validUuid, slotDraft)

      expect(slot.day_of_week).toBe(2)
      expect(store.blocksWithSlots[0].slots).toHaveLength(1)
      expect(db.createScheduleSlot).toHaveBeenCalledTimes(1)
    })

    it('elimina un slot individual', async () => {
      const store = useWeeklyScheduleStore()
      const slotId = '550e8400-e29b-41d4-a716-446655440001'
      store.blocksWithSlots = [
        {
          id: validUuid,
          title: 'Gimnasio',
          color: 'lavender',
          sort_order: 0,
          created_at: validIso,
          updated_at: validIso,
          slots: [
            {
              id: slotId,
              block_id: validUuid,
              day_of_week: 1,
              start_minutes: 480,
              end_minutes: 540,
              created_at: validIso,
              updated_at: validIso,
            },
          ],
        },
      ]

      await store.deleteSlot(slotId)

      expect(store.blocksWithSlots[0].slots).toHaveLength(0)
      expect(db.deleteScheduleSlot).toHaveBeenCalledWith(slotId)
    })

    it('elimina un bloque completo con todos sus slots', async () => {
      const store = useWeeklyScheduleStore()
      store.blocksWithSlots = [
        {
          id: validUuid,
          title: 'Gimnasio',
          color: 'lavender',
          sort_order: 0,
          created_at: validIso,
          updated_at: validIso,
          slots: [
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              block_id: validUuid,
              day_of_week: 1,
              start_minutes: 480,
              end_minutes: 540,
              created_at: validIso,
              updated_at: validIso,
            },
          ],
        },
      ]

      await store.deleteBlock(validUuid)

      expect(store.blocksWithSlots).toHaveLength(0)
      expect(db.deleteScheduleBlock).toHaveBeenCalledWith(validUuid)
    })
  })
})
