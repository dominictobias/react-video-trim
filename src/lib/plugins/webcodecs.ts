import {
  BlobSource,
  BufferTarget,
  Conversion,
  type ConversionAudioOptions,
  type ConversionVideoOptions,
  Input,
  type InputFormat,
  MP4,
  Mp4OutputFormat,
  Output,
  type OutputFormat,
  QTFF,
  WEBM,
  WebMOutputFormat,
} from 'mediabunny'

import type { TrimRange } from '../types'

export type WebCodecsOutputFormat = 'mp4' | 'webm'

export type WebCodecsTrimProgress = {
  /** Normalized progress between 0 and 1. */
  progress: number
  /** Input timestamp processed by Mediabunny, in seconds. */
  processedTime: number
}

const DEFAULT_INPUT_FORMATS = [MP4, QTFF, WEBM]

export type TrimVideoOptions = {
  /** Output container. Defaults to `mp4`. */
  outputFormat?: WebCodecsOutputFormat
  /** Output filename used in metadata. Defaults to `trimmed.{outputFormat}`. */
  outputFileName?: string
  /** Override the MIME type reported on the returned blob. */
  outputMimeType?: string
  /** Input formats passed to Mediabunny. Defaults to MP4, QuickTime/MOV, and WebM. */
  inputFormats?: InputFormat[]
  /** Mediabunny video conversion options. */
  video?: ConversionVideoOptions
  /** Mediabunny audio conversion options. */
  audio?: ConversionAudioOptions
  /** Called with normalized progress between 0 and 1 while trimming. */
  onProgress?: (progress: WebCodecsTrimProgress) => void
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

function assertSupportedBrowser(): void {
  if (
    typeof VideoDecoder === 'undefined' ||
    typeof VideoEncoder === 'undefined'
  ) {
    throw new Error('WebCodecs video encoding and decoding are required.')
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

function createOutputFormat(format: WebCodecsOutputFormat): OutputFormat {
  if (format === 'webm') {
    return new WebMOutputFormat()
  }

  return new Mp4OutputFormat()
}

function getOutputMimeType(format: OutputFormat, override?: string): string {
  return override ?? format.mimeType
}

function getConversionErrorMessage(
  conversion: Awaited<ReturnType<typeof Conversion.init>>,
): string {
  const reasons = [
    ...new Set(conversion.discardedTracks.map(({ reason }) => reason)),
  ]

  if (reasons.length === 0) {
    return 'Mediabunny cannot trim this file with the current browser codecs.'
  }

  return `Mediabunny cannot trim this file with the current browser codecs: ${reasons.join(', ')}.`
}

export async function trimVideo(
  src: File | Blob,
  range: TrimRange,
  options: TrimVideoOptions = {},
): Promise<TrimVideoResult> {
  assertSupportedBrowser()
  assertValidRange(range)

  const outputFormatName = options.outputFormat ?? 'mp4'
  const outputFormat = createOutputFormat(outputFormatName)
  const target = new BufferTarget()
  const input = new Input({
    source: new BlobSource(src),
    formats: options.inputFormats ?? DEFAULT_INPUT_FORMATS,
  })
  const output = new Output({
    format: outputFormat,
    target,
  })

  const conversion = await Conversion.init({
    input,
    output,
    trim: {
      start: range.startTime,
      end: range.endTime,
    },
    video: options.video,
    audio: options.audio,
    showWarnings: false,
  })

  if (!conversion.isValid) {
    throw new Error(getConversionErrorMessage(conversion))
  }

  if (options.onProgress) {
    conversion.onProgress = (progress, processedTime) => {
      options.onProgress?.({ progress, processedTime })
    }
  }

  await conversion.execute()

  if (!target.buffer) {
    throw new Error('Mediabunny produced an empty video.')
  }

  const mimeType = getOutputMimeType(outputFormat, options.outputMimeType)
  const fileName =
    options.outputFileName ??
    `trimmed.${outputFormat.fileExtension.replace(/^\./, '')}`

  return {
    blob: new Blob([target.buffer], { type: mimeType }),
    fileName,
    mimeType,
    range,
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
