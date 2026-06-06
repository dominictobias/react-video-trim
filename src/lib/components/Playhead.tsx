import { useRef } from 'react'

import styles from './Playhead.module.css'

type PlayheadProps = {
  position: number
  onDrag: (clientX: number) => void
}

export function Playhead({ position, onDrag }: PlayheadProps) {
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
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) {
          return
        }

        onDrag(event.clientX)
      }}
      onPointerUp={(event) => {
        draggingRef.current = false
        event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onPointerCancel={(event) => {
        draggingRef.current = false
        event.currentTarget.releasePointerCapture(event.pointerId)
      }}
    >
      <span className={styles.knob} />
    </div>
  )
}
