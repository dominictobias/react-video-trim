import { useEffect, useRef } from 'react'

import { drawVideoFrame, extractFrameAtTime } from '../frameExtractor'

const HOVER_THUMBNAIL_THROTTLE_MS = 120

type UseHoverThumbnailOptions = {
  src: string
  time: number | null
  duration: number
  width: number
  height: number
}

type HoverThumbnailRequest = Omit<UseHoverThumbnailOptions, 'time'> & {
  time: number
}

export function useHoverThumbnail({
  src,
  time,
  duration,
  width,
  height,
}: UseHoverThumbnailOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const lastGeneratedAtRef = useRef(0)
  const latestRequestRef = useRef<HoverThumbnailRequest | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }

      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
    }
  }, [src])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    canvas.width = width
    canvas.height = height
  }, [height, width])

  useEffect(() => {
    if (time === null || !src || !duration || !width || !height) {
      latestRequestRef.current = null
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
      return
    }

    latestRequestRef.current = {
      src,
      time,
      duration,
      width,
      height,
    }

    const generateThumbnail = () => {
      timeoutRef.current = null

      const request = latestRequestRef.current
      const canvas = canvasRef.current
      if (!request || !canvas) {
        return
      }

      const {
        src: requestSrc,
        time: requestTime,
        duration: requestDuration,
        width: requestWidth,
        height: requestHeight,
      } = request

      if (canvas.width !== requestWidth || canvas.height !== requestHeight) {
        canvas.width = requestWidth
        canvas.height = requestHeight
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return
      }

      const maxSeekTime = Math.max(0, requestDuration - 0.001)
      const targetTime = Math.min(Math.max(requestTime, 0), maxSeekTime)
      const abortController = new AbortController()

      abortControllerRef.current?.abort()
      abortControllerRef.current = abortController
      lastGeneratedAtRef.current = Date.now()

      extractFrameAtTime({
        src: requestSrc,
        time: targetTime,
        signal: abortController.signal,
        onFrame: (frame) => {
          if (abortController.signal.aborted) {
            return
          }

          ctx.fillStyle = '#0f1115'
          ctx.fillRect(0, 0, requestWidth, requestHeight)
          drawVideoFrame(ctx, frame, 0, 0, requestWidth, requestHeight)
        },
      }).catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        console.error('Failed to extract hover thumbnail', error)
      })
    }

    const remainingDelay = Math.max(
      0,
      HOVER_THUMBNAIL_THROTTLE_MS - (Date.now() - lastGeneratedAtRef.current),
    )

    if (remainingDelay === 0) {
      generateThumbnail()
    } else if (timeoutRef.current === null) {
      timeoutRef.current = window.setTimeout(generateThumbnail, remainingDelay)
    }
  }, [duration, height, src, time, width])

  return {
    canvasRef,
  }
}
