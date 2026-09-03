import { type BlockColorToken } from '@/schemas/weeklySchedule'

export function blockColorVar(c: BlockColorToken): string {
  return `--color-block-${c}`
}

export function blockColorRgb(c: BlockColorToken): string {
  return `rgb(var(--color-block-${c}))`
}

export function blockColorTint(c: BlockColorToken, alpha: number): string {
  return `rgba(var(--color-block-${c}), ${alpha})`
}
