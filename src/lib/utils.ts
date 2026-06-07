import type { KeyboardEvent } from 'react'

export function isRemoteVideoSrc(src: string): boolean {
  return /^https?:\/\//.test(src)
}

export function isSpaceKey(event: KeyboardEvent): boolean {
  return event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space'
}
