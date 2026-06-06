import { useEffect, useState } from 'react'

export function useVideoMetadata(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string | null,
) {
  const [duration, setDuration] = useState(0)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!src) {
      return
    }

    const video = videoRef.current
    if (!video) {
      return
    }

    const sync = () => {
      const nextDuration = Number.isFinite(video.duration) ? video.duration : 0
      setDuration(nextDuration)
      setIsReady(video.readyState >= HTMLMediaElement.HAVE_METADATA)
    }

    sync()
    video.addEventListener('loadedmetadata', sync)
    video.addEventListener('durationchange', sync)

    return () => {
      video.removeEventListener('loadedmetadata', sync)
      video.removeEventListener('durationchange', sync)
    }
  }, [src, videoRef])

  return { duration, isReady }
}
