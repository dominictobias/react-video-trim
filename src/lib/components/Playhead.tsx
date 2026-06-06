import { useRef } from 'react'

import styles from './Playhead.module.css'

type PlayheadProps = {
  position: number
  onDrag: (clientX: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

export function Playhead({
  position,
  onDrag,
  onDragStart,
  onDragEnd,
}: PlayheadProps) {
  const draggingRef = useRef(false)

  return (
    <div
      className={styles.playhead}
      style={{ left: `${position}px` }}
      onPointerDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        draggingRef.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
        onDragStart?.()
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) {
          return
        }

        event.stopPropagation()
        onDrag(event.clientX)
      }}
      onPointerUp={(event) => {
        event.stopPropagation()
        draggingRef.current = false
        event.currentTarget.releasePointerCapture(event.pointerId)
        onDragEnd?.()
      }}
      onPointerCancel={(event) => {
        event.stopPropagation()
        draggingRef.current = false
        event.currentTarget.releasePointerCapture(event.pointerId)
        onDragEnd?.()
      }}
    >
      <span className={styles.knob} />
    </div>
  )
}
