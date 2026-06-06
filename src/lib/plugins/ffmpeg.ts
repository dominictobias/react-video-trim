import ffmpegCoreWasmURL from '@ffmpeg/core/wasm?url'
import ffmpegCoreURL from '@ffmpeg/core?url'
import type {
  FFMessageLoadConfig,
  LogEvent,
  ProgressEvent,
} from '@ffmpeg/ffmpeg'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import ffmpegWorkerURL from '@ffmpeg/ffmpeg/worker?url'
import { fetchFile } from '@ffmpeg/util'

import type { TrimRange } from '../types'

export type TrimVideoOptions = {
  /** Output container extension without a dot. Defaults to `mp4`. */
  outputFormat?: string
  /** MIME type for the returned blob. Defaults to `video/mp4`. */
  outputMimeType?: string
  /** Output filename used in metadata. Defaults to `trimmed.{outputFormat}`. */
  outputFileName?: string
  /** Use stream copy (`-c copy`) for fast trimming. Defaults to `true`. */
  streamCopy?: boolean
  /** Override FFmpeg core load URLs and worker config. */
  loadConfig?: FFMessageLoadConfig
  /** Called with normalized progress between 0 and 1 while trimming. */
  onProgress?: (progress: number) => void
  /** Called with FFmpeg log output. */
  onLog?: (message: string) => void
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

let ffmpegInstance: FFmpeg | null = null
let ffmpegLoadPromise: Promise<FFmpeg> | null = null

function getInputFileName(src: File | Blob): string {
  if (src instanceof File && src.name.includes('.')) {
    const extension = src.name.split('.').pop()
    if (extension) {
      return `input.${extension}`
    }
  }

  if (src.type.startsWith('video/')) {
    const extension = src.type.split('/')[1]?.split(';')[0]
    if (extension) {
      return `input.${extension}`
    }
  }

  return 'input.mp4'
}

function getDefaultLoadConfig(
  loadConfig?: FFMessageLoadConfig,
): FFMessageLoadConfig {
  return {
    ...loadConfig,
    classWorkerURL: loadConfig?.classWorkerURL ?? ffmpegWorkerURL,
    coreURL: loadConfig?.coreURL ?? ffmpegCoreURL,
    wasmURL: loadConfig?.wasmURL ?? ffmpegCoreWasmURL,
  }
}

async function getFFmpeg(options: TrimVideoOptions = {}): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    return ffmpegInstance
  }

  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      const ffmpeg = new FFmpeg()
      const config = getDefaultLoadConfig(options.loadConfig)

      await ffmpeg.load(config)
      ffmpegInstance = ffmpeg
      return ffmpeg
    })()
  }

  return ffmpegLoadPromise
}

function attachRuntimeListeners(
  ffmpeg: FFmpeg,
  options: TrimVideoOptions,
): () => void {
  const onLog = ({ message }: LogEvent) => {
    options.onLog?.(message)
  }
  const onProgress = ({ progress }: ProgressEvent) => {
    options.onProgress?.(progress)
  }

  if (options.onLog) {
    ffmpeg.on('log', onLog)
  }

  if (options.onProgress) {
    ffmpeg.on('progress', onProgress)
  }

  return () => {
    if (options.onLog) {
      ffmpeg.off('log', onLog)
    }

    if (options.onProgress) {
      ffmpeg.off('progress', onProgress)
    }
  }
}

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

export async function trimVideo(
  src: File | Blob,
  range: TrimRange,
  options: TrimVideoOptions = {},
): Promise<TrimVideoResult> {
  assertValidRange(range)

  const outputFormat = options.outputFormat ?? 'mp4'
  const mimeType = options.outputMimeType ?? `video/${outputFormat}`
  const outputFileName = options.outputFileName ?? `trimmed.${outputFormat}`
  const inputFileName = getInputFileName(src)
  const streamCopy = options.streamCopy ?? true

  const ffmpeg = await getFFmpeg(options)
  const detachListeners = attachRuntimeListeners(ffmpeg, options)

  try {
    await ffmpeg.writeFile(inputFileName, await fetchFile(src))

    const args = [
      '-i',
      inputFileName,
      '-ss',
      String(range.startTime),
      '-to',
      String(range.endTime),
    ]

    if (streamCopy) {
      args.push('-c', 'copy')
    } else {
      args.push('-c:v', 'libx264', '-c:a', 'aac')
    }

    args.push(outputFileName)

    const exitCode = await ffmpeg.exec(args)
    if (exitCode !== 0) {
      throw new Error(`FFmpeg failed to trim video (exit code ${exitCode}).`)
    }

    const data = await ffmpeg.readFile(outputFileName)
    if (!(data instanceof Uint8Array)) {
      throw new Error('FFmpeg returned an unexpected output format.')
    }

    return {
      blob: new Blob([data.slice()], { type: mimeType }),
      fileName: outputFileName,
      mimeType,
      range,
    }
  } finally {
    detachListeners()

    await ffmpeg.deleteFile(inputFileName).catch(() => undefined)
    await ffmpeg.deleteFile(outputFileName).catch(() => undefined)
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
