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
        ? `Hakuun on jo saapunut 1 loppuselvitys, jolle ei ole vielä tehty asiatarkastusta. Kun
otantatarkastus otetaan käyttöön, järjestelmä tekee näille tarkastamattomille
loppuselvityksille satunnaisotantavalinnan välittömästi.`
        : `Hakuun on jo saapunut ${eligibleCount} loppuselvitystä, joille ei ole vielä tehty asiatarkastusta. Kun
otantatarkastus otetaan käyttöön, järjestelmä tekee näille tarkastamattomille
loppuselvityksille satunnaisotantavalinnan välittömästi.`
    return (
      <dialog ref={ref} data-test-id="backfill-confirm-modal" onClose={onClose}>
        <form method="dialog">
          <h2>Vahvista otantatarkastuksen käyttöönotto</h2>
          <p>{bodyText}</p>
          <p>
            Kaikki loppuselvitykset asiatarkastetaan normaalisti. Jos loppuselvitys valitaan
            satunnaisotantaan, se siirtyy asiatarkastuksen jälkeen taloustarkastukseen, ellei se
            ohjaudu taloustarkastukseen jo asiatarkastuksessa havaitun riskin perusteella.
          </p>
          <p>Voit myöhemmin palauttaa haun takaisin 2-vaiheiseen tarkastukseen.</p>
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
