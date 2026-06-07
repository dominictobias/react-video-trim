import { useEffect, useRef, useState } from 'react'

import { drawFilmstripFrame, extractFrames } from '../frameExtractor'
import type { FilmstripProgress } from '../types'

const THUMB_WIDTH = 48

type UseFilmstripOptions = {
  src: string
  duration: number
  trackWidth: number
  trackHeight: number
}

export function useFilmstrip({
  src,
  duration,
  trackWidth,
  trackHeight,
}: UseFilmstripOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [progress, setProgress] = useState<FilmstripProgress>({
    loaded: 0,
    total: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  const thumbCount =
    trackWidth > 0 ? Math.max(1, Math.floor(trackWidth / THUMB_WIDTH)) : 0

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas || !src || !duration || !trackWidth || !trackHeight) {
      return
    }

    const abortController = new AbortController()
    const width = thumbCount * THUMB_WIDTH

    canvas.width = width
    canvas.height = trackHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    ctx.fillStyle = '#0f1115'
    ctx.fillRect(0, 0, width, trackHeight)

    setIsLoading(true)
    setProgress({ loaded: 0, total: thumbCount })

    extractFrames({
      src,
      duration,
      thumbCount,
      signal: abortController.signal,
      onFrame: (index, frame) => {
        drawFilmstripFrame(ctx, index, frame, THUMB_WIDTH, trackHeight)
      },
      onProgress: (loaded, total) => {
        setProgress({ loaded, total })
        if (loaded >= total) {
          setIsLoading(false)
        }
      },
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      setIsLoading(false)
      console.error('Failed to extract filmstrip frames', error)
    })

    return () => {
      abortController.abort()
    }
  }, [duration, src, thumbCount, trackHeight, trackWidth])

  return {
    canvasRef,
    progress,
    isLoading,
    thumbWidth: THUMB_WIDTH,
    thumbCount,
  }
}
