import { useEffect, useState } from 'react'

import type { VideoCropProps } from './types'

export function useVideoObjectUrl(src: VideoCropProps['src']): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    if (typeof src === 'string') {
      return
    }

    const url = URL.createObjectURL(src)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- blob URL lifecycle
    setBlobUrl(url)

    return () => {
      URL.revokeObjectURL(url)
      setBlobUrl(null)
    }
  }, [src])

  if (typeof src === 'string') {
    return src
  }

  return blobUrl
}

export function isRemoteVideoSrc(src: string): boolean {
  return /^https?:\/\//.test(src)
}
