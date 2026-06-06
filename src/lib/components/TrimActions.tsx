import styles from './TrimActions.module.css'

type TrimActionsProps = {
  canTrim: boolean
  onTrim: () => void
  onCancel?: () => void
}

export function TrimActions({ canTrim, onTrim, onCancel }: TrimActionsProps) {
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
        Trim
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
          Cancel
        </button>
      ) : null}
    </div>
  )
}
