export type FrameExtractorOptions = {
  src: string
  duration: number
  thumbCount: number
  signal: AbortSignal
  onFrame: (index: number, bitmap: ImageBitmap) => void
  onProgress?: (loaded: number, total: number) => void
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

export function drawFilmstripFrame(
  ctx: CanvasRenderingContext2D,
  index: number,
  bitmap: ImageBitmap,
  thumbWidth: number,
  thumbHeight: number,
) {
  const x = index * thumbWidth
  const scale = Math.max(thumbWidth / bitmap.width, thumbHeight / bitmap.height)
  const drawWidth = bitmap.width * scale
  const drawHeight = bitmap.height * scale
  const offsetX = x + (thumbWidth - drawWidth) / 2
  const offsetY = (thumbHeight - drawHeight) / 2

  ctx.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight)
  bitmap.close()
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

    const safeDuration =
      Number.isFinite(duration) && duration > 0 ? duration : 0
    const count = Math.max(1, thumbCount)

    for (let index = 0; index < count; index += 1) {
      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }

      const time =
        count === 1 ? safeDuration / 2 : (index / (count - 1)) * safeDuration

      await seekVideo(video, time, signal)

      const bitmap = await createImageBitmap(video)
      onFrame(index, bitmap)
      onProgress?.(index + 1, count)
    }
  } finally {
    video.removeAttribute('src')
    video.load()
  }
}
