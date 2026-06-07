import { useEffect, useMemo, useState } from 'react'

import { VideoCrop } from './lib'
import type { TrimRange } from './lib'

import './demo.css'

type TrimVideoResult = {
  blob: Blob
  fileName: string
  mimeType: string
  range: TrimRange
}

let downloadUrl: string | null = null

function downloadTrimmedVideo({ blob, fileName }: TrimVideoResult): void {
  if (downloadUrl) {
    URL.revokeObjectURL(downloadUrl)
  }

  downloadUrl = URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = downloadUrl
  link.download = fileName
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
}

export function Demo() {
  const [videoSrc, setVideoSrc] = useState<File | null>(null)
  const [trimResult, setTrimResult] = useState<TrimVideoResult | null>(null)
  const [trimProgress, setTrimProgress] = useState<number | null>(null)
  const [trimError, setTrimError] = useState<string | null>(null)

  const previewUrl = useMemo(() => {
    if (!trimResult) {
      return null
    }

    return URL.createObjectURL(trimResult.blob)
  }, [trimResult])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleTrim = useMemo(() => {
    if (!videoSrc) {
      return undefined
    }

    return async (range: TrimRange) => {
      setTrimResult(null)
      setTrimProgress(0)
      setTrimError(null)

      const handleComplete = (result: TrimVideoResult) => {
        setTrimResult(result)
        setTrimProgress(null)
        setTrimError(null)
        downloadTrimmedVideo(result)
      }
      const handleError = (error: unknown) => {
        setTrimError(
          error instanceof Error ? error.message : 'Failed to trim video.',
        )
        setTrimProgress(null)
      }

      const { createTrimHandler } = await import('./lib/plugins/webcodecs')
      const trim = createTrimHandler({
        src: videoSrc,
        onProgress: ({ progress }) => setTrimProgress(progress),
        onComplete: handleComplete,
        onError: handleError,
      })

      await trim(range)
    }
  }, [videoSrc])

  return (
    <div className="demo">
      <header className="demo-header">
        <h1>React Video Trim</h1>
        <div className="demo-controls">
          <label className="demo-picker">
            Choose video
            <input
              type="file"
              accept="video/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                setTrimResult(null)
                setTrimProgress(null)
                setTrimError(null)
                setVideoSrc(file ?? null)
              }}
            />
          </label>
        </div>
      </header>

      {videoSrc && handleTrim ? (
        <VideoCrop
          key={`${videoSrc.name}-${videoSrc.size}-${videoSrc.lastModified}`}
          src={videoSrc}
          onTrim={(range: TrimRange) => {
            void handleTrim(range)
          }}
        />
      ) : (
        <p className="demo-placeholder">
          Select a video file to open the trim editor.
        </p>
      )}

      {trimProgress !== null ? (
        <p className="demo-status">
          Trimming video… {Math.round(trimProgress * 100)}%
        </p>
      ) : null}

      {trimError ? <p className="demo-error">{trimError}</p> : null}

      {trimResult ? (
        <div className="demo-result">
          <pre>{JSON.stringify(trimResult.range, null, 2)}</pre>
          <p>
            Output: {trimResult.fileName} (
            {(trimResult.blob.size / (1024 * 1024)).toFixed(2)} MB)
          </p>
          {previewUrl ? (
            <video className="demo-preview" src={previewUrl} controls />
          ) : null}
          <a
            className="demo-download"
            href={previewUrl ?? undefined}
            download={trimResult.fileName}
          >
            Download trimmed video
          </a>
        </div>
      ) : null}
    </div>
  )
}
