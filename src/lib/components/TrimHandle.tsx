import { useRef } from 'react'

import { usePointerDrag } from '../hooks/usePointerDrag'

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
  const dragOffsetRef = useRef(0)

  const dragHandlers = usePointerDrag({
    onDragStart: (event) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const boundaryX = side === 'left' ? rect.right : rect.left
      dragOffsetRef.current = event.clientX - boundaryX
      onDragStart?.()
    },
    onDragMove: (event) => onDrag(event.clientX - dragOffsetRef.current),
    onDragEnd,
  })

  return (
    <div
      className={side === 'left' ? styles.left : styles.right}
      style={{ left: `${position}px` }}
      {...dragHandlers}
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
