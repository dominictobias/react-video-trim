import { useCallback, useEffect, useRef, useState } from 'react'

type UseVideoControlsOptions = {
  trimStart: number
  trimEnd: number
  src: string | null
}

type TrimRange = {
  start: number
  end: number
}

export function useVideoControls(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  { trimStart, trimEnd, src }: UseVideoControlsOptions,
) {
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const trimRangeRef = useRef<TrimRange>({ start: trimStart, end: trimEnd })

  useEffect(() => {
    trimRangeRef.current = { start: trimStart, end: trimEnd }
  }, [trimEnd, trimStart])

  const seek = useCallback(
    (time: number, trimRange?: TrimRange) => {
      const video = videoRef.current
      if (!video || !Number.isFinite(time)) {
        return
      }

      if (trimRange) {
        trimRangeRef.current = trimRange
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

    const { start, end } = trimRangeRef.current

    if (video.currentTime < start || video.currentTime >= end) {
      video.currentTime = start
      setCurrentTime(start)
    }

    try {
      await video.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }, [videoRef])

  const pause = useCallback(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

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
    const stopAtTrimEnd = () => {
      const { start, end } = trimRangeRef.current

      if (end <= start || video.currentTime < end) {
        return
      }

      video.currentTime = end
      setCurrentTime(end)
      video.pause()
      setIsPlaying(false)
    }

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      stopAtTrimEnd()
    }

    let isActive = true
    let frameCallbackId: number | null = null

    const scheduleFrame = () => {
      if ('requestVideoFrameCallback' in video) {
        frameCallbackId = video.requestVideoFrameCallback(onFrame)
      }
    }

    const onFrame = () => {
      if (!isActive) {
        return
      }

      setCurrentTime(video.currentTime)
      stopAtTrimEnd()

      scheduleFrame()
    }

    syncDuration()
    video.addEventListener('loadedmetadata', syncDuration)
    video.addEventListener('durationchange', syncDuration)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTimeUpdate)

    scheduleFrame()

    return () => {
      isActive = false
      if (frameCallbackId !== null && 'cancelVideoFrameCallback' in video) {
        video.cancelVideoFrameCallback(frameCallbackId)
      }

      video.removeEventListener('loadedmetadata', syncDuration)
      video.removeEventListener('durationchange', syncDuration)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [src, videoRef])

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
