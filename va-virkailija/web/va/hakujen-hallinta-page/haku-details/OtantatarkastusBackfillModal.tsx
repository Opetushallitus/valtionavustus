import React, { forwardRef } from 'react'

import { ConfirmDialog } from '../../common-components/ConfirmDialog'

interface Props {
  eligibleCount: number
  onClose: () => void
}

export const OtantatarkastusBackfillModal = forwardRef<HTMLDialogElement, Props>(
  function OtantatarkastusBackfillModal({ eligibleCount, onClose }, ref) {
    const bodyText =
      eligibleCount === 0
        ? `Hakuun ei ole tällä hetkellä yhtään asiatarkastamatonta loppuselvitystä, joten
otantavalintaa ei tehdä nyt yhdellekään. Otantatarkastus koskee kaikkia tästä eteenpäin
saapuvia loppuselvityksiä, joille tehdään satunnaisotantavalinta lähetyshetkellä.`
        : eligibleCount === 1
          ? `Hakuun on jo saapunut 1 loppuselvitys, jolle ei ole vielä tehty asiatarkastusta. Kun
otantatarkastus otetaan käyttöön, järjestelmä tekee näille tarkastamattomille
loppuselvityksille satunnaisotantavalinnan välittömästi.`
          : `Hakuun on jo saapunut ${eligibleCount} loppuselvitystä, joille ei ole vielä tehty asiatarkastusta. Kun
otantatarkastus otetaan käyttöön, järjestelmä tekee näille tarkastamattomille
loppuselvityksille satunnaisotantavalinnan välittömästi.`
    return (
      <ConfirmDialog
        ref={ref}
        title="Vahvista otantatarkastuksen käyttöönotto"
        cancelLabel="Peruuta"
        confirmLabel="Ota käyttöön"
        testId="backfill-confirm-modal"
        cancelTestId="backfill-cancel-button"
        confirmTestId="backfill-confirm-button"
        onClose={onClose}
      >
        <p>{bodyText}</p>
        <p>
          Kaikki loppuselvitykset asiatarkastetaan normaalisti. Jos loppuselvitys valitaan
          satunnaisotantaan, se siirtyy asiatarkastuksen jälkeen taloustarkastukseen, ellei se
          ohjaudu taloustarkastukseen jo asiatarkastuksessa havaitun riskin perusteella.
        </p>
        <p>Voit myöhemmin palauttaa haun takaisin 2-vaiheiseen tarkastukseen.</p>
      </ConfirmDialog>
    )
  }
)
