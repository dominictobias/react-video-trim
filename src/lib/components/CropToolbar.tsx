import type { KeyboardEvent } from 'react'

import { FilmstripTrack } from './FilmstripTrack'
import { PlayButton } from './PlayButton'
import { TrimActions } from './TrimActions'

import styles from './CropToolbar.module.css'

type CropToolbarProps = {
  src: string
  duration: number
  currentTime: number
  startTime: number
  endTime: number
  isPlaying: boolean
  canTrim: boolean
  onTogglePlay: () => void
  onSeek: (time: number) => void
  onStartChange: (time: number) => void
  onEndChange: (time: number) => void
  onTrackWidthChange: (width: number) => void
  onTrim: () => void
  onCancel?: () => void
}

function isSpaceKey(event: KeyboardEvent) {
  return event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space'
}

export function CropToolbar({
  src,
  duration,
  currentTime,
  startTime,
  endTime,
  isPlaying,
  canTrim,
  onTogglePlay,
  onSeek,
  onStartChange,
  onEndChange,
  onTrackWidthChange,
  onTrim,
  onCancel,
}: CropToolbarProps) {
  const handleToolbarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return
    }

    if (!isSpaceKey(event) || event.repeat) {
      return
    }

    event.preventDefault()
    onTogglePlay()
  }

  return (
    <div
      className={styles.toolbar}
      role="group"
      aria-label="Video trim controls"
      tabIndex={0}
      onKeyDown={handleToolbarKeyDown}
    >
      <PlayButton isPlaying={isPlaying} onToggle={onTogglePlay} />
      <div className={styles.trackArea}>
        <FilmstripTrack
          src={src}
          duration={duration}
          currentTime={currentTime}
          startTime={startTime}
          endTime={endTime}
          onSeek={onSeek}
          onStartChange={onStartChange}
          onEndChange={onEndChange}
          onTrackWidthChange={onTrackWidthChange}
        />
      </div>
      <TrimActions canTrim={canTrim} onTrim={onTrim} onCancel={onCancel} />
    </div>
  )
}
