import { useRef } from 'react'

import styles from './TrimHandle.module.css'

type TrimHandleProps = {
  side: 'left' | 'right'
  position: number
  onDrag: (clientX: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

export function TrimHandle({
  side,
  position,
  onDrag,
  onDragStart,
  onDragEnd,
}: TrimHandleProps) {
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
        onDragStart?.()
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) {
          return
        }

        event.stopPropagation()
        onDrag(event.clientX - dragOffsetRef.current)
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
      <div className={styles.grip}>
        <div className={styles.lines}>
          <span className={styles.line} />
          <span className={styles.line} />
        </div>
      </div>
    </div>
  )
}
