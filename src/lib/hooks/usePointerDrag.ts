import { type PointerEvent, useRef } from 'react'

type UsePointerDragOptions = {
  onDragStart?: (event: PointerEvent<HTMLDivElement>) => void
  onDragMove: (event: PointerEvent<HTMLDivElement>) => void
  onDragEnd?: () => void
}

/**
 * Shared pointer-drag lifecycle (capture, propagation, dragging state) for
 * draggable timeline elements like the playhead and trim handles.
 */
export function usePointerDrag({
  onDragStart,
  onDragMove,
  onDragEnd,
}: UsePointerDragOptions) {
  const draggingRef = useRef(false)

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (!draggingRef.current) {
      return
    }

    draggingRef.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
    onDragEnd?.()
  }

  return {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      draggingRef.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
      onDragStart?.(event)
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) {
        return
      }

      event.stopPropagation()
      onDragMove(event)
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  }
}
