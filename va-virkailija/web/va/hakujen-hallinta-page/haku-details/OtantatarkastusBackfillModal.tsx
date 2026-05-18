import React, { forwardRef } from 'react'

interface Props {
  eligibleCount: number
  onClose: () => void
}

export const OtantatarkastusBackfillModal = forwardRef<HTMLDialogElement, Props>(
  function OtantatarkastusBackfillModal({ eligibleCount, onClose }, ref) {
    return (
      <dialog ref={ref} data-test-id="backfill-confirm-modal" onClose={onClose}>
        <form method="dialog">
          <h2>Ota otantatarkastus käyttöön?</h2>
          <p>
            Hakuun on jo lähetetty <strong>{eligibleCount}</strong> loppuselvitystä, joille ei vielä
            ole tehty asiatarkastusta. Käyttöönotto arpoo niille otannan välittömästi.
          </p>
          <div>
            <button type="submit" value="cancel" data-test-id="backfill-cancel-button">
              Peruuta
            </button>
            <button type="submit" value="confirm" data-test-id="backfill-confirm-button">
              Ota käyttöön
            </button>
          </div>
        </form>
      </dialog>
    )
  }
)
