import styles from './PlayButton.module.css'

type PlayButtonProps = {
  isPlaying: boolean
  onToggle: () => void
  labels: {
    play: string
    pause: string
  }
}

export function PlayButton({ isPlaying, onToggle, labels }: PlayButtonProps) {
  return (
    <button
      type="button"
      className={styles.button}
      aria-label={isPlaying ? labels.pause : labels.play}
      onPointerDown={(event) => {
        event.preventDefault()
        onToggle()
      }}
    >
      {isPlaying ? (
        <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
          <rect x="3" y="2" width="4" height="12" rx="1" />
          <rect x="9" y="2" width="4" height="12" rx="1" />
        </svg>
      ) : (
        <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 2.5v11l10-5.5z" />
        </svg>
      )}
    </button>
  )
}
