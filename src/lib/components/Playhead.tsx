import { usePointerDrag } from '../hooks/usePointerDrag'

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
  const dragHandlers = usePointerDrag({
    onDragStart,
    onDragMove: (event) => onDrag(event.clientX),
    onDragEnd,
  })

  return (
    <div
      className={styles.playhead}
      style={{ left: `${position}px` }}
      {...dragHandlers}
    >
      <span className={styles.knob} />
    </div>
  )
}
