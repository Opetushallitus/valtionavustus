import React, { useEffect, useRef } from 'react'

interface Props {
  eligibleCount: number
  onConfirm: () => void
  onCancel: () => void
}

export const OtantatarkastusBackfillModal: React.FC<Props> = ({
  eligibleCount,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) {
      dialog.showModal()
    }
    return () => {
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      data-test-id="backfill-confirm-modal"
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      onClose={onCancel}
    >
      <h2>Ota otantatarkastus käyttöön?</h2>
      <p>
        Hakuun on jo lähetetty <strong>{eligibleCount}</strong> loppuselvitystä, joille ei vielä ole
        tehty asiatarkastusta. Käyttöönotto arpoo niille otannan välittömästi.
      </p>
      <div>
        <button type="button" data-test-id="backfill-cancel-button" onClick={onCancel}>
          Peruuta
        </button>
        <button type="button" data-test-id="backfill-confirm-button" onClick={onConfirm}>
          Ota käyttöön
        </button>
      </div>
    </dialog>
  )
}
