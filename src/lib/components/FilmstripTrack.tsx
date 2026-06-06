import { useCallback, useEffect, useRef, useState } from 'react'

import { useFilmstrip } from '../hooks/useFilmstrip'
import { Playhead } from './Playhead'
import { TrimHandle } from './TrimHandle'

import styles from './FilmstripTrack.module.css'

type FilmstripTrackProps = {
  src: string
  duration: number
  currentTime: number
  startTime: number
  endTime: number
  onSeek: (time: number) => void
  onStartChange: (time: number) => void
  onEndChange: (time: number) => void
  onTrackWidthChange: (width: number) => void
}

export function FilmstripTrack({
  src,
  duration,
  currentTime,
  startTime,
  endTime,
  onSeek,
  onStartChange,
  onEndChange,
  onTrackWidthChange,
}: FilmstripTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [trackWidth, setTrackWidth] = useState(0)
  const trackHeight = 56

  const { canvasRef, isLoading, progress } = useFilmstrip({
    src,
    duration,
    trackWidth,
    trackHeight,
  })

  useEffect(() => {
    const track = trackRef.current
    if (!track) {
      return
    }

    const updateWidth = () => {
      const width = track.clientWidth
      setTrackWidth(width)
      onTrackWidthChange(width)
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(track)

    return () => observer.disconnect()
  }, [onTrackWidthChange])

  const pxToTime = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track || !duration) {
        return 0
      }

      const rect = track.getBoundingClientRect()
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
      return ratio * duration
    },
    [duration],
  )

  const timeToPx = useCallback(
    (time: number) => {
      if (!duration || !trackWidth) {
        return 0
      }

      return (time / duration) * trackWidth
    },
    [duration, trackWidth],
  )

  const startPx = timeToPx(startTime)
  const endPx = timeToPx(endTime)
  const playheadPx = timeToPx(currentTime)

  const handleTrackPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return
      }

      const nextTime = pxToTime(event.clientX)

      if (nextTime < startTime) {
        onStartChange(nextTime)
        return
      }

      if (nextTime > endTime) {
        onEndChange(nextTime)
        return
      }

      onSeek(nextTime)
    },
    [endTime, onEndChange, onSeek, onStartChange, pxToTime, startTime],
  )

  return (
    <div ref={trackRef} className={styles.track}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.overlay}>
        <div className={styles.dimLeft} style={{ width: `${startPx}px` }} />
        <div
          className={styles.dimRight}
          style={{ width: `${Math.max(trackWidth - endPx, 0)}px` }}
        />
        <div
          className={styles.selection}
          style={{
            left: `${startPx}px`,
            width: `${Math.max(endPx - startPx, 0)}px`,
          }}
        />
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          Loading frames {progress.loaded}/{progress.total}
        </div>
      ) : null}

      <div
        className={styles.interactive}
        onPointerDown={handleTrackPointerDown}
      >
        <TrimHandle
          side="left"
          position={startPx}
          onDrag={(clientX) => onStartChange(pxToTime(clientX))}
        />
        <TrimHandle
          side="right"
          position={endPx}
          onDrag={(clientX) => onEndChange(pxToTime(clientX))}
        />
        <Playhead
          position={playheadPx}
          onDrag={(clientX) => onSeek(pxToTime(clientX))}
        />
      </div>
    </div>
  )
}
