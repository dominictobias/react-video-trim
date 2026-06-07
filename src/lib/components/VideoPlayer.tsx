import { forwardRef } from 'react'

import { isSpaceKey } from '../utils'

import styles from './VideoPlayer.module.css'

type VideoPlayerProps = {
  src: string
  ariaLabel: string
  onTogglePlay: () => void
  onError?: () => void
  onLoadedMetadata?: () => void
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  function VideoPlayer(
    { src, ariaLabel, onTogglePlay, onError, onLoadedMetadata },
    ref,
  ) {
    return (
      <div className={styles.wrapper}>
        <video
          ref={ref}
          className={styles.video}
          src={src}
          aria-label={ariaLabel}
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
