import { useCallback, useState } from 'react'

const MIN_TRIM_DURATION = 0.1

type UseTrimSelectionOptions = {
  duration: number
  trackWidth: number
}

export function useTrimSelection({
  duration,
  trackWidth,
}: UseTrimSelectionOptions) {
  const [startRatio, setStartRatio] = useState(0)
  const [endRatio, setEndRatio] = useState(1)
  const [prevDuration, setPrevDuration] = useState(duration)

  if (duration !== prevDuration) {
    setPrevDuration(duration)
    setStartRatio(0)
    setEndRatio(1)
  }

  const startTime = startRatio * duration
  const endTime = endRatio * duration

  const timeToPx = useCallback(
    (time: number) => {
      if (!duration || !trackWidth) {
        return 0
      }

      return (time / duration) * trackWidth
    },
    [duration, trackWidth],
  )

  const pxToTime = useCallback(
    (px: number) => {
      if (!duration || !trackWidth) {
        return 0
      }

      const ratio = Math.min(Math.max(px / trackWidth, 0), 1)
      return ratio * duration
    },
    [duration, trackWidth],
  )

  const setStart = useCallback(
    (time: number) => {
      if (!duration) {
        return
      }

      const maxStart = Math.max(0, endTime - MIN_TRIM_DURATION)
      const clamped = Math.min(Math.max(time, 0), maxStart)
      setStartRatio(clamped / duration)
    },
    [duration, endTime],
  )

  const setEnd = useCallback(
    (time: number) => {
      if (!duration) {
        return
      }

      const minEnd = Math.min(duration, startTime + MIN_TRIM_DURATION)
      const clamped = Math.min(Math.max(time, minEnd), duration)
      setEndRatio(clamped / duration)
    },
    [duration, startTime],
  )

  const hasChanges = duration > 0 && (startRatio > 0.001 || endRatio < 0.999)

  return {
    startTime,
    endTime,
    setStart,
    setEnd,
    timeToPx,
    pxToTime,
    hasChanges,
  }
}
