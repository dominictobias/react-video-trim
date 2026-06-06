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
  return (
    <div className={styles.toolbar}>
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
