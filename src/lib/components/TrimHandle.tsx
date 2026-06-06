import { useRef } from 'react'

import styles from './TrimHandle.module.css'

type TrimHandleProps = {
  side: 'left' | 'right'
  position: number
  onDrag: (clientX: number) => void
}

export function TrimHandle({ side, position, onDrag }: TrimHandleProps) {
  const draggingRef = useRef(false)
  const dragOffsetRef = useRef(0)

  return (
    <div
      className={side === 'left' ? styles.left : styles.right}
      style={{ left: `${position}px` }}
      onPointerDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        draggingRef.current = true
        const rect = event.currentTarget.getBoundingClientRect()
        const boundaryX = side === 'left' ? rect.right : rect.left
        dragOffsetRef.current = event.clientX - boundaryX
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) {
          return
        }

        onDrag(event.clientX - dragOffsetRef.current)
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
