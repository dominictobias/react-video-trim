import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { TrimToolbar } from './components/TrimToolbar'
import { VideoPlayer } from './components/VideoPlayer'
import { useTrimSelection } from './hooks/useTrimSelection'
import { useVideoControls } from './hooks/useVideoControls'
import { useVideoMetadata } from './hooks/useVideoMetadata'
import type { VideoTrimProps } from './types'
import { useVideoObjectUrl } from './useVideoObjectUrl'

import styles from './VideoTrim.module.css'

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

export function VideoTrim({
  src,
  onTrim,
  onCancel,
  className,
  style,
}: VideoTrimProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const resolvedSrc = useVideoObjectUrl(src)

  const { duration, isReady } = useVideoMetadata(videoRef, resolvedSrc)
  const { startTime, endTime, setStart, setEnd, hasChanges } = useTrimSelection(
    {
      duration,
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
    if (!isReady || isPlaying) {
      return
    }

    if (currentTime < startTime) {
      seekWithinTrim(startTime)
      return
    }

    if (currentTime > endTime) {
      seekWithinTrim(endTime)
    }
  }, [currentTime, endTime, isPlaying, isReady, seekWithinTrim, startTime])

  const handleStartChange = useCallback(
    (time: number) => {
      const nextStart = setStart(time)
      seek(nextStart, { start: nextStart, end: endTime })
    },
    [endTime, seek, setStart],
  )

  const handleEndChange = useCallback(
    (time: number) => {
      const nextEnd = setEnd(time)
      seek(nextEnd, { start: startTime, end: nextEnd })
    },
    [seek, setEnd, startTime],
  )

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
      <div className={styles.videoStage}>
        <VideoPlayer
          ref={videoRef}
          src={resolvedSrc}
          onTogglePlay={togglePlay}
          onError={handleVideoError}
          onLoadedMetadata={handleVideoLoaded}
        />

        {isReady && duration > 0 ? (
          <div className={styles.toolbarOverlay}>
            <TrimToolbar
              src={resolvedSrc}
              duration={duration}
              currentTime={currentTime}
              startTime={startTime}
              endTime={endTime}
              isPlaying={isPlaying}
              canTrim={hasChanges}
              onTogglePlay={togglePlay}
              onSeek={seekWithinTrim}
              onStartChange={handleStartChange}
              onEndChange={handleEndChange}
              onTrim={handleTrim}
              onCancel={onCancel}
            />
          </div>
        ) : null}
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}
    </div>
  )
}
