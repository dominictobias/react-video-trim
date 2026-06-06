import { useCallback, useEffect, useRef, useState } from 'react'

import { useFilmstrip } from '../hooks/useFilmstrip'
import { useHoverThumbnail } from '../hooks/useHoverThumbnail'
import { Playhead } from './Playhead'
import { TrimHandle } from './TrimHandle'

import styles from './FilmstripTrack.module.css'

const HANDLE_WIDTH = 14
const PLAYHEAD_WIDTH = 2
const HOVER_PREVIEW_WIDTH = 144
const HOVER_PREVIEW_HEIGHT = 82

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

function formatPreviewTime(time: number) {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  const milliseconds = Math.floor((time % 1) * 1000)

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds
    .toString()
    .padStart(3, '0')}`
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
  const [hoverPreview, setHoverPreview] = useState<{
    x: number
    time: number
  } | null>(null)
  const trackHeight = 56
  const timelineLeftPx = HANDLE_WIDTH
  const timelineWidth = Math.max(trackWidth - HANDLE_WIDTH * 2, 0)

  const { canvasRef, isLoading, progress } = useFilmstrip({
    src,
    duration,
    trackWidth: timelineWidth,
    trackHeight,
  })
  const { canvasRef: hoverCanvasRef } = useHoverThumbnail({
    src,
    duration,
    time: hoverPreview?.time ?? null,
    width: HOVER_PREVIEW_WIDTH,
    height: HOVER_PREVIEW_HEIGHT,
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

  const clientXToTrackPx = useCallback((clientX: number) => {
    const track = trackRef.current
    if (!track) {
      return 0
    }

    const rect = track.getBoundingClientRect()
    return Math.min(Math.max(clientX - rect.left, 0), rect.width)
  }, [])

  const pxToTime = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track || !duration) {
        return 0
      }

      const rect = track.getBoundingClientRect()
      if (!rect.width) {
        return 0
      }

      const timelineWidth = Math.max(rect.width - HANDLE_WIDTH * 2, 0)
      if (!timelineWidth) {
        return 0
      }

      const x = clientXToTrackPx(clientX)
      const timelineX = Math.min(Math.max(x - HANDLE_WIDTH, 0), timelineWidth)

      return (timelineX / timelineWidth) * duration
    },
    [clientXToTrackPx, duration],
  )

  const timeToPx = useCallback(
    (time: number) => {
      if (!duration || !trackWidth) {
        return 0
      }

      return timelineLeftPx + (time / duration) * timelineWidth
    },
    [duration, timelineLeftPx, timelineWidth, trackWidth],
  )

  const clampToTrimRange = useCallback(
    (time: number) => Math.min(Math.max(time, startTime), endTime),
    [endTime, startTime],
  )

  const startBoundaryPx = timeToPx(startTime)
  const endBoundaryPx = timeToPx(endTime)
  const startPx = Math.max(startBoundaryPx - HANDLE_WIDTH, 0)
  const endPx = Math.min(endBoundaryPx + HANDLE_WIDTH, trackWidth)
  const playheadPx = timeToPx(clampToTrimRange(currentTime))
  const playheadMinPx = Math.min(
    startBoundaryPx,
    Math.max(startBoundaryPx, endBoundaryPx - PLAYHEAD_WIDTH),
  )
  const playheadMaxPx = Math.max(playheadMinPx, endBoundaryPx - PLAYHEAD_WIDTH)
  const displayedPlayheadPx = Math.min(
    Math.max(playheadPx, playheadMinPx),
    playheadMaxPx,
  )
  const hoverPreviewLeft = hoverPreview
    ? Math.min(
        Math.max(hoverPreview.x - HOVER_PREVIEW_WIDTH / 2, 0),
        Math.max(trackWidth - HOVER_PREVIEW_WIDTH, 0),
      )
    : 0
  const displayedTime = hoverPreview?.time ?? clampToTrimRange(currentTime)

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

  const handleTrackPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const x = clientXToTrackPx(event.clientX)
      setHoverPreview({
        x,
        time: pxToTime(event.clientX),
      })
    },
    [clientXToTrackPx, pxToTime],
  )

  const clearHoverPreview = useCallback(() => {
    setHoverPreview(null)
  }, [])

  return (
    <div className={styles.container}>
      {hoverPreview ? (
        <div
          className={styles.hoverPreview}
          style={{
            left: `${hoverPreviewLeft}px`,
            width: `${HOVER_PREVIEW_WIDTH}px`,
          }}
          aria-hidden="true"
        >
          <canvas
            ref={hoverCanvasRef}
            className={styles.hoverCanvas}
            width={HOVER_PREVIEW_WIDTH}
            height={HOVER_PREVIEW_HEIGHT}
          />
        </div>
      ) : null}

      <div ref={trackRef} className={styles.track}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          style={{
            left: `${timelineLeftPx}px`,
            width: `${timelineWidth}px`,
          }}
        />

        <div className={styles.overlay}>
          <div
            className={styles.dimLeft}
            style={{
              left: `${timelineLeftPx}px`,
              width: `${Math.max(startBoundaryPx - timelineLeftPx, 0)}px`,
            }}
          />
          <div
            className={styles.dimRight}
            style={{
              right: `${HANDLE_WIDTH}px`,
              width: `${Math.max(timelineLeftPx + timelineWidth - endBoundaryPx, 0)}px`,
            }}
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

        <span className={styles.trackTime} aria-hidden="true">
          {formatPreviewTime(displayedTime)}
        </span>

        <div
          className={styles.interactive}
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
          onPointerLeave={() => setHoverPreview(null)}
          onPointerCancel={() => setHoverPreview(null)}
        >
          <TrimHandle
            side="left"
            position={startPx}
            onDrag={(clientX) => onStartChange(pxToTime(clientX))}
            onDragStart={clearHoverPreview}
            onDragEnd={clearHoverPreview}
          />
          <TrimHandle
            side="right"
            position={endPx}
            onDrag={(clientX) => onEndChange(pxToTime(clientX))}
            onDragStart={clearHoverPreview}
            onDragEnd={clearHoverPreview}
          />
          <Playhead
            position={displayedPlayheadPx}
            onDrag={(clientX) => onSeek(clampToTrimRange(pxToTime(clientX)))}
            onDragStart={clearHoverPreview}
            onDragEnd={clearHoverPreview}
          />
        </div>
      </div>
    </div>
  )
}
