import styles from './TrimActions.module.css'

type TrimActionsProps = {
  canTrim: boolean
  onTrim: () => void
  onCancel?: () => void
  labels: {
    trim: string
    cancel: string
  }
}

export function TrimActions({
  canTrim,
  onTrim,
  onCancel,
  labels,
}: TrimActionsProps) {
  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.trim}
        disabled={!canTrim}
        onPointerDown={(event) => {
          event.preventDefault()
          if (canTrim) {
            onTrim()
          }
        }}
      >
        {labels.trim}
      </button>
      {onCancel ? (
        <button
          type="button"
          className={styles.cancel}
          onPointerDown={(event) => {
            event.preventDefault()
            onCancel()
          }}
        >
          {labels.cancel}
        </button>
      ) : null}
    </div>
  )
}
