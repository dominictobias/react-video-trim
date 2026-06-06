import type { TrimRange } from '../types'

export type MediaRecorderTrimProgress = {
  /** Normalized progress between 0 and 1. */
  progress: number
  /** Seconds recorded so far. */
  elapsedSeconds: number
  /** Estimated seconds left. */
  remainingSeconds: number
  /** Total selected trim duration in seconds. */
  durationSeconds: number
}

export type TrimVideoOptions = {
  /** Preferred MediaRecorder MIME type. Defaults to the first supported browser format. */
  outputMimeType?: string
  /** Output filename used in metadata. Defaults to `trimmed.{detected-extension}`. */
  outputFileName?: string
  /** Canvas capture frame rate. Defaults to `30`. */
  frameRate?: number
  /** MediaRecorder timeslice in milliseconds. Defaults to `250`. */
  timesliceMs?: number
  /** Passed to the native MediaRecorder constructor. */
  audioBitsPerSecond?: number
  /** Passed to the native MediaRecorder constructor. */
  videoBitsPerSecond?: number
  /** Passed to the native MediaRecorder constructor. */
  bitsPerSecond?: number
  /** Called while the selected range is replayed and recorded. */
  onProgress?: (progress: MediaRecorderTrimProgress) => void
}

export type TrimVideoResult = {
  blob: Blob
  fileName: string
  mimeType: string
  range: TrimRange
}

export type CreateTrimHandlerOptions = TrimVideoOptions & {
  src: File | Blob
  onComplete?: (result: TrimVideoResult) => void | Promise<void>
  onError?: (error: unknown) => void
}

type CanvasCaptureResult = {
  stream: MediaStream
  stop: () => void
}

type AudioCaptureResult = {
  tracks: MediaStreamTrack[]
  start: () => Promise<void>
  stop: () => void | Promise<void>
}

const DEFAULT_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4',
]

function assertValidRange(range: TrimRange): void {
  if (!Number.isFinite(range.startTime) || !Number.isFinite(range.endTime)) {
    throw new Error('Trim range must contain finite start and end times.')
  }

  if (range.startTime < 0) {
    throw new Error('Trim start time must be greater than or equal to 0.')
  }

  if (range.endTime <= range.startTime) {
    throw new Error('Trim end time must be greater than the start time.')
  }
}

function assertSupportedBrowser(): void {
  if (typeof document === 'undefined') {
    throw new Error('MediaRecorder trimming requires a browser environment.')
  }

  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder is not supported in this browser.')
  }
}

function getSupportedMimeType(preferredMimeType?: string): string {
  if (preferredMimeType) {
    if (MediaRecorder.isTypeSupported(preferredMimeType)) {
      return preferredMimeType
    }

    throw new Error(
      `MediaRecorder does not support output MIME type "${preferredMimeType}".`,
    )
  }

  const mimeType = DEFAULT_MIME_TYPES.find((candidate) =>
    MediaRecorder.isTypeSupported(candidate),
  )

  if (!mimeType) {
    throw new Error('No supported MediaRecorder video MIME type was found.')
  }

  return mimeType
}

function getExtensionFromMimeType(mimeType: string): string {
  const normalizedMimeType = mimeType.toLowerCase()

  if (normalizedMimeType.includes('mp4')) {
    return 'mp4'
  }

  if (normalizedMimeType.includes('ogg')) {
    return 'ogv'
  }

  return 'webm'
}

function loadMetadata(video: HTMLVideoElement, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('error', handleError)
    }

    const handleLoadedMetadata = () => {
      cleanup()
      resolve()
    }

    const handleError = () => {
      cleanup()
      reject(new Error('Unable to load video metadata for trimming.'))
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata, {
      once: true,
    })
    video.addEventListener('error', handleError, { once: true })
    video.preload = 'auto'
    video.src = src
    video.load()
  })
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('seeked', handleSeeked)
      video.removeEventListener('error', handleError)
    }

    const handleSeeked = () => {
      cleanup()
      resolve()
    }

    const handleError = () => {
      cleanup()
      reject(new Error('Unable to seek to the trim start time.'))
    }

    video.addEventListener('seeked', handleSeeked, { once: true })
    video.addEventListener('error', handleError, { once: true })
    video.currentTime = time
  })
}

function createCanvasCapture(
  video: HTMLVideoElement,
  frameRate: number,
): CanvasCaptureResult {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth || 1
  canvas.height = video.videoHeight || 1

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Unable to create a 2D canvas context for trimming.')
  }

  const stream = canvas.captureStream(frameRate)
  let animationFrameId: number | null = null
  let stopped = false

  const drawFrame = () => {
    if (stopped) {
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    animationFrameId = window.requestAnimationFrame(drawFrame)
  }

  drawFrame()

  return {
    stream,
    stop: () => {
      stopped = true

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }
    },
  }
}

function createAudioCapture(video: HTMLVideoElement): AudioCaptureResult {
  const AudioContextConstructor = window.AudioContext

  if (!AudioContextConstructor) {
    video.muted = true
    return {
      tracks: [],
      start: () => Promise.resolve(),
      stop: () => undefined,
    }
  }

  const audioContext = new AudioContextConstructor()
  const source = audioContext.createMediaElementSource(video)
  const destination = audioContext.createMediaStreamDestination()
  source.connect(destination)

  return {
    tracks: destination.stream.getAudioTracks(),
    start: () => audioContext.resume(),
    stop: async () => {
      source.disconnect()
      await audioContext.close()
    },
  }
}

function emitProgress(
  range: TrimRange,
  currentTime: number,
  onProgress?: (progress: MediaRecorderTrimProgress) => void,
): void {
  if (!onProgress) {
    return
  }

  const durationSeconds = range.endTime - range.startTime
  const elapsedSeconds = Math.min(
    Math.max(currentTime - range.startTime, 0),
    durationSeconds,
  )

  onProgress({
    progress: durationSeconds > 0 ? elapsedSeconds / durationSeconds : 1,
    elapsedSeconds,
    remainingSeconds: Math.max(durationSeconds - elapsedSeconds, 0),
    durationSeconds,
  })
}

export async function trimVideo(
  src: File | Blob,
  range: TrimRange,
  options: TrimVideoOptions = {},
): Promise<TrimVideoResult> {
  assertSupportedBrowser()
  assertValidRange(range)

  const srcUrl = URL.createObjectURL(src)
  const video = document.createElement('video')
  video.crossOrigin = 'anonymous'
  video.playsInline = true

  const mimeType = getSupportedMimeType(options.outputMimeType)
  const outputFileName =
    options.outputFileName ?? `trimmed.${getExtensionFromMimeType(mimeType)}`

  let canvasCapture: CanvasCaptureResult | null = null
  let audioCapture: AudioCaptureResult | null = null
  let progressTimerId: number | null = null
  let stopFallbackTimerId: number | null = null

  try {
    await loadMetadata(video, srcUrl)
    await seekTo(video, range.startTime)

    canvasCapture = createCanvasCapture(video, options.frameRate ?? 30)
    audioCapture = createAudioCapture(video)

    const stream = new MediaStream([
      ...canvasCapture.stream.getVideoTracks(),
      ...audioCapture.tracks,
    ])
    const recorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: options.audioBitsPerSecond,
      videoBitsPerSecond: options.videoBitsPerSecond,
      bitsPerSecond: options.bitsPerSecond,
    })
    const chunks: BlobPart[] = []

    const result = new Promise<Blob>((resolve, reject) => {
      const stopRecording = () => {
        if (recorder.state !== 'inactive') {
          recorder.stop()
        }
      }

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      })
      recorder.addEventListener('error', () => {
        reject(new Error('MediaRecorder failed while trimming video.'))
      })
      recorder.addEventListener(
        'stop',
        () => {
          resolve(new Blob(chunks, { type: recorder.mimeType || mimeType }))
        },
        { once: true },
      )
      video.addEventListener('ended', stopRecording, { once: true })

      recorder.start(options.timesliceMs ?? 250)
      emitProgress(range, range.startTime, options.onProgress)

      progressTimerId = window.setInterval(() => {
        emitProgress(range, video.currentTime, options.onProgress)

        if (video.currentTime >= range.endTime) {
          stopRecording()
        }
      }, 250)

      const durationMs = (range.endTime - range.startTime) * 1000
      stopFallbackTimerId = window.setTimeout(stopRecording, durationMs + 500)
    })

    await audioCapture.start()
    await video.play()
    const blob = await result
    emitProgress(range, range.endTime, options.onProgress)

    if (blob.size === 0) {
      throw new Error('MediaRecorder produced an empty video.')
    }

    return {
      blob,
      fileName: outputFileName,
      mimeType: blob.type || mimeType,
      range,
    }
  } finally {
    video.pause()
    video.removeAttribute('src')
    video.load()

    if (progressTimerId !== null) {
      window.clearInterval(progressTimerId)
    }

    if (stopFallbackTimerId !== null) {
      window.clearTimeout(stopFallbackTimerId)
    }

    canvasCapture?.stop()
    canvasCapture?.stream.getTracks().forEach((track) => track.stop())
    await audioCapture?.stop()
    URL.revokeObjectURL(srcUrl)
  }
}

export function createTrimHandler(
  options: CreateTrimHandlerOptions,
): (range: TrimRange) => Promise<void> {
  const { src, onComplete, onError, ...trimOptions } = options

  return async (range: TrimRange) => {
    try {
      const result = await trimVideo(src, range, trimOptions)
      await onComplete?.(result)
    } catch (error) {
      if (onError) {
        onError(error)
        return
      }

      throw error
    }
  }
}
