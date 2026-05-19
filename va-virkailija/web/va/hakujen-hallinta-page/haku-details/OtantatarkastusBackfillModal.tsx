import React, { forwardRef } from 'react'

import * as styles from './OtantatarkastusBackfillModal.module.css'

interface Props {
  eligibleCount: number
  onClose: () => void
}

export const OtantatarkastusBackfillModal = forwardRef<HTMLDialogElement, Props>(
  function OtantatarkastusBackfillModal({ eligibleCount, onClose }, ref) {
    const bodyText =
      eligibleCount === 1
        ? `Hakuun on jo lähetetty 1 loppuselvitys, jolle ei vielä ole tehty asiatarkastusta. Käyttöönotto arpoo sille otannan välittömästi.`
        : `Hakuun on jo lähetetty ${eligibleCount} loppuselvitystä, joille ei vielä ole tehty asiatarkastusta. Käyttöönotto arpoo niille otannan välittömästi.`
    return (
      <dialog ref={ref} data-test-id="backfill-confirm-modal" onClose={onClose}>
        <form method="dialog">
          <h2>Ota otantatarkastus käyttöön?</h2>
          <p>{bodyText}</p>
          <div className={styles.buttons}>
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
