import { useCallback, useState } from 'react'

import { MIN_TRIM_DURATION } from '../constants'

type UseTrimSelectionOptions = {
  duration: number
}

export function useTrimSelection({ duration }: UseTrimSelectionOptions) {
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

  const setStart = useCallback(
    (time: number): number => {
      if (!duration) {
        return startTime
      }

      const maxStart = Math.max(0, endTime - MIN_TRIM_DURATION)
      const clamped = Math.min(Math.max(time, 0), maxStart)
      setStartRatio(clamped / duration)
      return clamped
    },
    [duration, endTime, startTime],
  )

  const setEnd = useCallback(
    (time: number): number => {
      if (!duration) {
        return endTime
      }

      const minEnd = Math.min(duration, startTime + MIN_TRIM_DURATION)
      const clamped = Math.min(Math.max(time, minEnd), duration)
      setEndRatio(clamped / duration)
      return clamped
    },
    [duration, startTime, endTime],
  )

  const hasChanges = duration > 0 && (startRatio > 0.001 || endRatio < 0.999)

  return {
    startTime,
    endTime,
    setStart,
    setEnd,
    hasChanges,
  }
}
