import { forwardRef } from 'react'

import styles from './VideoPlayer.module.css'

type VideoPlayerProps = {
  src: string
  onTogglePlay: () => void
  onError?: () => void
  onLoadedMetadata?: () => void
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  function VideoPlayer(
    { src, onTogglePlay, onError, onLoadedMetadata },
    ref,
  ) {
    return (
      <div className={styles.wrapper}>
        <video
          ref={ref}
          className={styles.video}
          src={src}
          playsInline
          preload="metadata"
          onError={onError}
          onLoadedMetadata={onLoadedMetadata}
          onPointerDown={(event) => {
            event.preventDefault()
            onTogglePlay()
          }}
        />
      </div>
    )
  },
)
