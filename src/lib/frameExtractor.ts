export type FrameExtractorOptions = {
  src: string
  duration: number
  thumbCount: number
  signal: AbortSignal
  onFrame: (index: number, frame: HTMLVideoElement) => void
  onProgress?: (loaded: number, total: number) => void
}

export type FrameExtractorFrameOptions = {
  src: string
  time: number
  signal: AbortSignal
  onFrame: (frame: HTMLVideoElement) => void
}

function waitForEvent(
  target: EventTarget,
  eventName: string,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const onAbort = () => {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    const onEvent = () => {
      cleanup()
      resolve()
    }

    const cleanup = () => {
      target.removeEventListener(eventName, onEvent)
      signal.removeEventListener('abort', onAbort)
    }

    target.addEventListener(eventName, onEvent, { once: true })
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function waitForMetadata(
  video: HTMLVideoElement,
  signal: AbortSignal,
): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    return Promise.resolve()
  }

  return waitForEvent(video, 'loadedmetadata', signal)
}

function waitForCurrentFrame(
  video: HTMLVideoElement,
  signal: AbortSignal,
): Promise<void> {
  if (
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0
  ) {
    return Promise.resolve()
  }

  return waitForEvent(video, 'loadeddata', signal)
}

function seekVideo(
  video: HTMLVideoElement,
  time: number,
  signal: AbortSignal,
): Promise<void> {
  if (Math.abs(video.currentTime - time) < 0.001) {
    return Promise.resolve()
  }

  video.currentTime = time
  return waitForEvent(video, 'seeked', signal)
}

function getFrameSize(frame: HTMLVideoElement) {
  return {
    width: frame.videoWidth,
    height: frame.videoHeight,
  }
}

export function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  frame: HTMLVideoElement,
  x: number,
  y: number,
  targetWidth: number,
  targetHeight: number,
  fit: 'contain' | 'cover' = 'cover',
) {
  const { width, height } = getFrameSize(frame)
  if (!width || !height) {
    return
  }

  const scale =
    fit === 'contain'
      ? Math.min(targetWidth / width, targetHeight / height)
      : Math.max(targetWidth / width, targetHeight / height)
  const drawWidth = width * scale
  const drawHeight = height * scale
  const offsetX = x + (targetWidth - drawWidth) / 2
  const offsetY = y + (targetHeight - drawHeight) / 2

  ctx.drawImage(frame, offsetX, offsetY, drawWidth, drawHeight)
}

export function drawFilmstripFrame(
  ctx: CanvasRenderingContext2D,
  index: number,
  frame: HTMLVideoElement,
  thumbWidth: number,
  thumbHeight: number,
) {
  drawVideoFrame(ctx, frame, index * thumbWidth, 0, thumbWidth, thumbHeight)
}

export async function extractFrames({
  src,
  duration,
  thumbCount,
  signal,
  onFrame,
  onProgress,
}: FrameExtractorOptions): Promise<void> {
  const video = document.createElement('video')
  video.preload = 'auto'
  video.muted = true
  video.playsInline = true

  if (/^https?:\/\//.test(src)) {
    video.crossOrigin = 'anonymous'
  }

  video.src = src

  try {
    await waitForMetadata(video, signal)
    await waitForCurrentFrame(video, signal)

    const safeDuration =
      Number.isFinite(duration) && duration > 0 ? duration : 0
    const count = Math.max(1, thumbCount)
    const maxSeekTime = Math.max(0, safeDuration - 0.001)

    for (let index = 0; index < count; index += 1) {
      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }

      const time =
        count === 1 ? maxSeekTime / 2 : (index / (count - 1)) * maxSeekTime

      await seekVideo(video, time, signal)
      await waitForCurrentFrame(video, signal)

      onFrame(index, video)
      onProgress?.(index + 1, count)
    }
  } finally {
    video.removeAttribute('src')
    video.load()
  }
}

export async function extractFrameAtTime({
  src,
  time,
  signal,
  onFrame,
}: FrameExtractorFrameOptions): Promise<void> {
  const video = document.createElement('video')
  video.preload = 'auto'
  video.muted = true
  video.playsInline = true

  if (/^https?:\/\//.test(src)) {
    video.crossOrigin = 'anonymous'
  }

  video.src = src

  try {
    await waitForMetadata(video, signal)
    await seekVideo(video, Math.max(time, 0), signal)
    await waitForCurrentFrame(video, signal)

    onFrame(video)
  } finally {
    video.removeAttribute('src')
    video.load()
  }
}
