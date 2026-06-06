# React Video Trim

A React component for selecting trim ranges on a video with a filmstrip timeline.

The core library reports the selected `{ startTime, endTime }` range. Optional FFmpeg.wasm and native MediaRecorder plugins can turn that range into a trimmed video file in the browser.

## Install

```bash
npm install react-video-trim
```

React and React DOM are required peer dependencies:

```bash
npm install react react-dom
```

For browser-side trimming with the optional FFmpeg plugin, also install:

```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

## Bundler

This package ships as ESM only. Use it with Vite, Next.js, webpack, or any modern bundler that supports `import`.

Import the component and its styles:

```tsx
import { VideoCrop } from 'react-video-trim'
import 'react-video-trim/style.css'
```

The plugins are separate entry points so the core bundle does not load trimming code unless you import it:

```tsx
import { createTrimHandler } from 'react-video-trim/plugins/ffmpeg'
import { createTrimHandler as createMediaRecorderTrimHandler } from 'react-video-trim/plugins/mediaRecorder'
import { createTrimHandler as createWebCodecsTrimHandler } from 'react-video-trim/plugins/webcodecs'
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

## Choosing a trimming plugin

`react-video-trim` keeps browser-side video processing in optional plugins so you can choose the best trade-off for your app:

- **FFmpeg plugin**: the most capable option because FFmpeg.wasm can handle a wide range of containers and codecs, but it adds a large WebAssembly payload. Expect roughly 42 MB for the FFmpeg core download before compression/caching.
- **WebCodecs plugin**: lightweight, fast, and modern. It uses the browser's native WebCodecs APIs through Mediabunny, so it avoids shipping FFmpeg.wasm and can copy or transcode media efficiently. The trade-off is browser codec support: WebCodecs support overlaps with `<video>` playback support, but it is not identical, and some files a browser can play may not be available to decode or encode through WebCodecs.
- **MediaRecorder plugin**: the smallest and broadest browser-native fallback. It replays the selected range through a `<video>` element and records a canvas/media stream, so it should work with anything the browser can play and MediaRecorder can output. The trade-off is that it runs in real time: trimming 20 seconds of video takes about 20 seconds.

Use WebCodecs first when you want a small, fast client-side implementation for modern browsers. Use MediaRecorder when broad playback compatibility matters more than speed. Use FFmpeg when you need the widest trimming/transcoding capability and can accept the larger download.

## Example with the FFmpeg plugin

Use `createTrimHandler` as an `onTrim` adapter when you want FFmpeg.wasm to produce a trimmed file:

```tsx
import { useMemo, useState } from 'react'
import { VideoCrop } from 'react-video-trim'
import { createTrimHandler } from 'react-video-trim/plugins/ffmpeg'
import type { TrimVideoResult } from 'react-video-trim/plugins/ffmpeg'
import 'react-video-trim/style.css'

export function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [result, setResult] = useState<TrimVideoResult | null>(null)

  const onTrim = useMemo(() => {
    if (!videoFile) return undefined

    return createTrimHandler({
      src: videoFile,
      onComplete: setResult,
      onError: console.error,
      onProgress: (progress) => {
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

Or call `trimVideo` directly:

```tsx
import { trimVideo } from 'react-video-trim/plugins/ffmpeg'

const result = await trimVideo(videoFile, {
  startTime: 2.5,
  endTime: 12,
})

const url = URL.createObjectURL(result.blob)
```

The FFmpeg plugin loads FFmpeg lazily on first use and downloads `@ffmpeg/core` from a CDN by default.

## Example with the WebCodecs plugin

The WebCodecs plugin uses Mediabunny to trim media in modern browsers without shipping FFmpeg.wasm. It can copy media data when possible and transcode when needed, depending on the browser codecs and output format:

```tsx
import { useMemo, useState } from 'react'
import { VideoCrop } from 'react-video-trim'
import { createTrimHandler } from 'react-video-trim/plugins/webcodecs'
import type { TrimVideoResult } from 'react-video-trim/plugins/webcodecs'
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
        console.log(`Trimming... ${Math.round(progress * 100)}%`)
      },
    })
  }, [videoFile])

  if (!videoFile || !onTrim) return null

  return (
    <>
      <VideoCrop
        src={videoFile}
        onTrim={(range) => {
          void onTrim(range)
        }}
      />
      {result ? (
        <video src={URL.createObjectURL(result.blob)} controls />
      ) : null}
    </>
  )
}
```

## Example with the MediaRecorder plugin

The MediaRecorder plugin is a MUCH more lightweight alternative to FFmpeg.wasm, which is massive. The caveat is that it records the selected range in real time, so trimming a 20 second range takes about 20 seconds. Use the progress callback to show your own loader and estimated time left:

```tsx
import { useMemo, useState } from 'react'
import { VideoCrop } from 'react-video-trim'
import { createTrimHandler, type TrimVideoResult } from 'react-video-trim/plugins/mediaRecorder'
import 'react-video-trim/style.css'

export function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [result, setResult] = useState<TrimVideoResult | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  const onTrim = useMemo(() => {
    if (!videoFile) return undefined

    return createTrimHandler({
      src: videoFile,
      onComplete: (trimResult) => {
        setResult(trimResult)
        setSecondsLeft(null)
      },
      onError: console.error,
      onProgress: ({ remainingSeconds }) => {
        setSecondsLeft(Math.ceil(remainingSeconds))
      },
    })
  }, [videoFile])

  if (!videoFile || !onTrim) return null

  return (
    <>
      <VideoCrop
        src={videoFile}
        onTrim={(range) => {
          void onTrim(range)
        }}
      />
      {secondsLeft !== null ? (
        <p>Trimming video, about {secondsLeft}s left.</p>
      ) : null}
      {result ? (
        <video src={URL.createObjectURL(result.blob)} controls />
      ) : null}
    </>
  )
}
```

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
bun run build   # type-check and build dist/react-video-trim.js + dist/plugins/*.js
bun run lint
bun run preview # preview the production build locally
```

The demo lives in `src/Demo.tsx` and uses the FFmpeg plugin to trim and preview the output.
