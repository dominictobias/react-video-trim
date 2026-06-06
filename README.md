# React Video Trim

A React component for selecting trim ranges on a video with a filmstrip timeline.

https://github.com/user-attachments/assets/9fe230f8-cab3-483a-9a70-fc6a5c0013fd

The core library reports the selected `{ startTime, endTime }` range. The included WebCodecs plugin can turn that range into a trimmed video file in the browser.

## Install

```bash
bun add react-video-trim
```

React and React DOM are required peer dependencies:

```bash
bun add react react-dom
```

## Bundler

This package ships as ESM only. Use it with Vite, Next.js, webpack, or any modern bundler that supports `import`.

Import the component and its styles:

```tsx
import { VideoCrop } from 'react-video-trim'
import 'react-video-trim/style.css'
```

The WebCodecs trimming plugin is a separate entry point so the core bundle does not load video processing code unless you import it:

```tsx
import { createTrimHandler } from 'react-video-trim/plugins/webcodecs'
```

## Props

### `VideoCrop`

| Prop        | Type                         | Required | Description                                                                         |
| ----------- | ---------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `src`       | `string \| File \| Blob`     | Yes      | Video source URL, file, or blob.                                                    |
| `onTrim`    | `(range: TrimRange) => void` | Yes      | Called when the user confirms a trim. Receives `{ startTime, endTime }` in seconds. |
| `onCancel`  | `() => void`                 | No       | Called when the user cancels.                                                       |
| `className` | `string`                     | No       | Applied to the root element.                                                        |
| `style`     | `CSSProperties`              | No       | Inline styles for the root element.                                                 |

### `TrimRange`

| Field       | Type     | Description                 |
| ----------- | -------- | --------------------------- |
| `startTime` | `number` | Trim start time in seconds. |
| `endTime`   | `number` | Trim end time in seconds.   |

## Example

```tsx
import { useState } from 'react'
import { VideoCrop } from 'react-video-trim'
import type { TrimRange } from 'react-video-trim'
import 'react-video-trim/style.css'

export function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [trimRange, setTrimRange] = useState<TrimRange | null>(null)

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
      />

      {videoFile ? (
        <VideoCrop
          src={videoFile}
          onTrim={setTrimRange}
          onCancel={() => setTrimRange(null)}
        />
      ) : null}

      {trimRange ? <pre>{JSON.stringify(trimRange, null, 2)}</pre> : null}
    </div>
  )
}
```

## WebCodecs Trimming

Use `createTrimHandler` as an `onTrim` adapter when you want WebCodecs to produce a trimmed file:

```tsx
import { useMemo, useState } from 'react'
import { VideoCrop } from 'react-video-trim'
import {
  type TrimVideoResult,
  createTrimHandler,
} from 'react-video-trim/plugins/webcodecs'
import 'react-video-trim/style.css'

export function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [result, setResult] = useState<TrimVideoResult | null>(null)

  const onTrim = useMemo(() => {
    if (!videoFile) return undefined

    return createTrimHandler({
      src: videoFile,
      outputFormat: 'mp4',
      onComplete: setResult,
      onError: console.error,
      onProgress: ({ progress }) => {
        console.log(`Trimming… ${Math.round(progress * 100)}%`)
      },
    })
  }, [videoFile])

  if (!videoFile || !onTrim) return null

  return (
    <VideoCrop
      src={videoFile}
      onTrim={(range) => {
        void onTrim(range)
      }}
    />
  )
}
```

Or call `trimVideo` directly when you do not need the React handler adapter:

```tsx
import { trimVideo } from 'react-video-trim/plugins/webcodecs'

const result = await trimVideo(videoFile, {
  startTime: 2.5,
  endTime: 12,
})

const url = URL.createObjectURL(result.blob)
```

The WebCodecs implementation uses Mediabunny to trim media in modern browsers without shipping a large video processing runtime. It can copy media data when possible and transcode when needed, depending on the browser codecs and selected output format.

## Alternatives

WebCodecs is the default recommendation for this package because it keeps the browser bundle small and uses native media APIs. Depending on your product requirements, you may still consider another trimming strategy in your own app.

### FFmpeg

FFmpeg.wasm runs FFmpeg in the browser through WebAssembly.

Pros:

- Handles a broad range of containers, codecs, and transformations.
- Gives you FFmpeg's familiar command model when you need advanced processing.
- Can be a good fit for apps that need maximum format coverage and can tolerate heavier downloads.

Cons:

- Adds a large (~38-42mb) WebAssembly payload compared with WebCodecs.
- Usually has a slower startup because the FFmpeg runtime must load before work begins.
- Increases memory and CPU pressure, especially on mobile devices.

### MediaRecorder

MediaRecorder can replay the selected range through a media element or canvas stream and record the result with native browser APIs.

Pros:

- No large processing runtime to download.
- Works with browser-native APIs and can support files the browser can play.
- Useful as a simple compatibility fallback for basic recording workflows.

Cons:

- Runs in real time, so trimming a 20 second range takes about 20 seconds.
- Output format and codec choices are limited by each browser's MediaRecorder support.
- Re-recording can reduce quality and may not preserve the original media streams exactly.

## Development

Clone the repo, install dependencies, and start the demo app:

```bash
git clone <repo-url>
cd react-video-trim
bun install
bun run dev
```

Other useful commands:

```bash
bun run build   # type-check and build dist/react-video-trim.js + dist/plugins/webcodecs.js
bun run lint
bun run preview # preview the production build locally
```

The demo lives in `src/Demo.tsx` and uses WebCodecs to trim and preview the output.
