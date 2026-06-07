import type { KeyboardEvent } from 'react'

import { isSpaceKey } from '../utils'
import { FilmstripTrack } from './FilmstripTrack'
import { PlayButton } from './PlayButton'
import { TrimActions } from './TrimActions'

import styles from './TrimToolbar.module.css'

type TrimToolbarProps = {
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
  onTrim: () => void
  onCancel?: () => void
}

export function TrimToolbar({
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
  onTrim,
  onCancel,
}: TrimToolbarProps) {
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
        />
      </div>
      <TrimActions canTrim={canTrim} onTrim={onTrim} onCancel={onCancel} />
    </div>
  )
}
