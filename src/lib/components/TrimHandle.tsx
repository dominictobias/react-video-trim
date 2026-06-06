import { useRef } from 'react'

import styles from './TrimHandle.module.css'

type TrimHandleProps = {
  side: 'left' | 'right'
  position: number
  onDrag: (clientX: number) => void
}

export function TrimHandle({ side, position, onDrag }: TrimHandleProps) {
  const draggingRef = useRef(false)

  return (
    <div
      className={side === 'left' ? styles.left : styles.right}
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
      <div className={styles.grip}>
        <div className={styles.lines}>
          <span className={styles.line} />
          <span className={styles.line} />
        </div>
      </div>
    </div>
  )
}
