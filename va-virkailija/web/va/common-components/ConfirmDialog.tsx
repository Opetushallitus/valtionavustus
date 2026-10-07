import React, { forwardRef } from 'react'

import * as styles from './ConfirmDialog.module.css'

interface Props {
  title: string
  cancelLabel: string
  confirmLabel: string
  testId: string
  cancelTestId: string
  confirmTestId: string
  onClose: () => void
  children: React.ReactNode
}

export const ConfirmDialog = forwardRef<HTMLDialogElement, Props>(function ConfirmDialog(
  { title, cancelLabel, confirmLabel, testId, cancelTestId, confirmTestId, onClose, children },
  ref
) {
  return (
    <dialog ref={ref} data-test-id={testId} onClose={onClose}>
      <form method="dialog">
        <h2>{title}</h2>
        {children}
        <div className={styles.buttons}>
          <button type="submit" value="cancel" data-test-id={cancelTestId}>
            {cancelLabel}
          </button>
          <button type="submit" value="confirm" data-test-id={confirmTestId}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  )
})
