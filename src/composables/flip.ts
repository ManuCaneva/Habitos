export interface FlipRect {
  left: number
  top: number
  width: number
  height: number
}

export const FLIP_DURATION_MS = 180
export const FLIP_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function flipTransform(first: FlipRect, last: FlipRect): string {
  const scaleX = last.width === 0 ? 1 : first.width / last.width
  const scaleY = last.height === 0 ? 1 : first.height / last.height
  const tx = first.left - last.left
  const ty = first.top - last.top
  return `translate(${tx}px, ${ty}px) scale(${scaleX}, ${scaleY})`
}

export function flipNeedsAnimation(first: FlipRect, last: FlipRect): boolean {
  return (
    Math.abs(first.left - last.left) > 0.5 ||
    Math.abs(first.top - last.top) > 0.5 ||
    Math.abs(first.width - last.width) > 0.5 ||
    Math.abs(first.height - last.height) > 0.5
  )
}
