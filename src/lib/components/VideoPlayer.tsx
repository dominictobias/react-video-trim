import { type KeyboardEvent, forwardRef } from 'react'

import styles from './VideoPlayer.module.css'

type VideoPlayerProps = {
  src: string
  onTogglePlay: () => void
  onError?: () => void
  onLoadedMetadata?: () => void
}

function isSpaceKey(event: KeyboardEvent) {
  return event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space'
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  function VideoPlayer({ src, onTogglePlay, onError, onLoadedMetadata }, ref) {
    return (
      <div className={styles.wrapper}>
        <video
          ref={ref}
          className={styles.video}
          src={src}
          playsInline
          preload="metadata"
          tabIndex={0}
          onError={onError}
          onLoadedMetadata={onLoadedMetadata}
          onKeyDown={(event) => {
            if (!isSpaceKey(event) || event.repeat) {
              return
            }

            event.preventDefault()
            onTogglePlay()
          }}
          onPointerDown={(event) => {
            event.preventDefault()
            onTogglePlay()
          }}
        />
      </div>
    )
  },
)
