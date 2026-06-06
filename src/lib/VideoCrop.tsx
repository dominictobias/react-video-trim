import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { CropToolbar } from './components/CropToolbar'
import { VideoPlayer } from './components/VideoPlayer'
import { useTrimSelection } from './hooks/useTrimSelection'
import { useVideoControls } from './hooks/useVideoControls'
import { useVideoMetadata } from './hooks/useVideoMetadata'
import type { VideoCropProps } from './types'
import { useVideoObjectUrl } from './useVideoObjectUrl'

import styles from './VideoCrop.module.css'

function getVideoErrorMessage(video: HTMLVideoElement): string {
  switch (video.error?.code) {
    case MediaError.MEDIA_ERR_DECODE:
      return 'Unable to decode this video. Its codec may not be supported in this browser.'
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'This video format is not supported in this browser.'
    default:
      return 'Unable to load this video.'
  }
}

export function VideoCrop({
  src,
  onTrim,
  onCancel,
  className,
  style,
}: VideoCropProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [trackWidth, setTrackWidth] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const resolvedSrc = useVideoObjectUrl(src)

  const { duration, isReady } = useVideoMetadata(videoRef, resolvedSrc)
  const { startTime, endTime, setStart, setEnd, hasChanges } = useTrimSelection(
    {
      duration,
      trackWidth,
    },
  )

  const { currentTime, isPlaying, seek, togglePlay, pause } = useVideoControls(
    videoRef,
    { trimStart: startTime, trimEnd: endTime, src: resolvedSrc },
  )

  const seekWithinTrim = useCallback(
    (time: number) => {
      seek(Math.min(Math.max(time, startTime), endTime))
    },
    [endTime, seek, startTime],
  )

  useEffect(() => {
    if (!isReady) {
      return
    }

    if (currentTime < startTime) {
      seekWithinTrim(startTime)
      return
    }

    if (currentTime > endTime) {
      seekWithinTrim(endTime)
    }
  }, [currentTime, endTime, isReady, seekWithinTrim, startTime])

  const handleTrackWidthChange = useCallback((width: number) => {
    setTrackWidth(width)
  }, [])

  const handleTrim = useCallback(() => {
    pause()
    onTrim({ startTime, endTime })
  }, [endTime, onTrim, pause, startTime])

  const handleVideoError = useCallback(() => {
    const video = videoRef.current
    if (!video?.error || !resolvedSrc) {
      return
    }

    if (video.currentSrc !== resolvedSrc) {
      return
    }

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      return
    }

    setError(getVideoErrorMessage(video))
  }, [resolvedSrc])

  const handleVideoLoaded = useCallback(() => {
    setError(null)
  }, [])

  const rootClassName = useMemo(
    () => [styles.root, className].filter(Boolean).join(' '),
    [className],
  )

  if (!resolvedSrc) {
    return <div className={rootClassName} style={style} />
  }

  return (
    <div className={rootClassName} style={style}>
      <VideoPlayer
        ref={videoRef}
        src={resolvedSrc}
        onTogglePlay={togglePlay}
        onError={handleVideoError}
        onLoadedMetadata={handleVideoLoaded}
      />

      {error ? <div className={styles.error}>{error}</div> : null}

      {isReady && duration > 0 ? (
        <CropToolbar
          src={resolvedSrc}
          duration={duration}
          currentTime={currentTime}
          startTime={startTime}
          endTime={endTime}
          isPlaying={isPlaying}
          canTrim={hasChanges}
          onTogglePlay={togglePlay}
          onSeek={seekWithinTrim}
          onStartChange={setStart}
          onEndChange={setEnd}
          onTrackWidthChange={handleTrackWidthChange}
          onTrim={handleTrim}
          onCancel={onCancel}
        />
      ) : null}
    </div>
  )
}
