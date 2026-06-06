import { useCallback, useEffect, useRef, useState } from 'react'

type UseVideoControlsOptions = {
  trimStart: number
  trimEnd: number
  src: string | null
}

export function useVideoControls(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  { trimStart, trimEnd, src }: UseVideoControlsOptions,
) {
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const loopRef = useRef(false)

  const seek = useCallback(
    (time: number) => {
      const video = videoRef.current
      if (!video || !Number.isFinite(time)) {
        return
      }

      const clamped = Math.min(
        Math.max(time, 0),
        duration || video.duration || 0,
      )
      video.currentTime = clamped
      setCurrentTime(clamped)
    },
    [duration, videoRef],
  )

  const play = useCallback(async () => {
    const video = videoRef.current
    if (!video) {
      return
    }

    if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
      video.currentTime = trimStart
      setCurrentTime(trimStart)
    }

    loopRef.current = true

    try {
      await video.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }, [trimEnd, trimStart, videoRef])

  const pause = useCallback(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    loopRef.current = false
    video.pause()
    setIsPlaying(false)
  }, [videoRef])

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      pause()
      return
    }

    await play()
  }, [isPlaying, pause, play])

  useEffect(() => {
    if (!src) {
      loopRef.current = false
      return
    }

    const video = videoRef.current
    if (!video) {
      return
    }

    const syncDuration = () => {
      const nextDuration = Number.isFinite(video.duration) ? video.duration : 0
      setDuration(nextDuration)
      setIsReady(video.readyState >= HTMLMediaElement.HAVE_METADATA)
    }

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onTimeUpdate = () => setCurrentTime(video.currentTime)

    const onFrame = () => {
      setCurrentTime(video.currentTime)

      if (
        loopRef.current &&
        trimEnd > trimStart &&
        video.currentTime >= trimEnd - 0.05
      ) {
        video.currentTime = trimStart
        setCurrentTime(trimStart)
      }

      if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(onFrame)
      }
    }

    syncDuration()
    video.addEventListener('loadedmetadata', syncDuration)
    video.addEventListener('durationchange', syncDuration)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTimeUpdate)

    if ('requestVideoFrameCallback' in video) {
      video.requestVideoFrameCallback(onFrame)
    }

    return () => {
      loopRef.current = false
      video.removeEventListener('loadedmetadata', syncDuration)
      video.removeEventListener('durationchange', syncDuration)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [src, trimEnd, trimStart, videoRef])

  return {
    duration,
    currentTime,
    isReady,
    isPlaying,
    seek,
    play,
    pause,
    togglePlay,
  }
}
