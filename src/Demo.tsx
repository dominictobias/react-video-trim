import { useState } from 'react'

import { VideoCrop } from './lib'
import type { TrimRange } from './lib'

import './demo.css'

export function Demo() {
  const [videoSrc, setVideoSrc] = useState<File | null>(null)
  const [trimResult, setTrimResult] = useState<TrimRange | null>(null)

  return (
    <div className="demo">
      <header className="demo-header">
        <h1>React Video Crop</h1>
        <label className="demo-picker">
          Choose video
          <input
            type="file"
            accept="video/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              setTrimResult(null)
              setVideoSrc(file ?? null)
            }}
          />
        </label>
      </header>

      {videoSrc ? (
        <VideoCrop
          key={`${videoSrc.name}-${videoSrc.size}-${videoSrc.lastModified}`}
          src={videoSrc}
          onTrim={(range) => setTrimResult(range)}
          onCancel={() => setTrimResult(null)}
        />
      ) : (
        <p className="demo-placeholder">
          Select a video file to open the trim editor.
        </p>
      )}

      {trimResult ? (
        <pre className="demo-result">{JSON.stringify(trimResult, null, 2)}</pre>
      ) : null}
    </div>
  )
}
