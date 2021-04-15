import React from 'react'
import {
  Language,
  Meno,
  Translations,
  Muutoshakemus, Talousarvio
} from 'va-common/web/va/types/muutoshakemus'

import './talous.less'

type MenoRowProps = {
  meno: Meno
  lang: Language
  talousarvio?: { [key: string]: number }
  originalTalousarvio: Talousarvio
}

const MenoRow = ({ talousarvio, meno, lang, originalTalousarvio }: MenoRowProps) => {
  const value = talousarvio?.[meno.type]
  const amountClass = value === meno.amount ? '' : 'linethrough'
  const originalAmount = originalTalousarvio.find(t => t.type === meno.type)?.amount

  return (
    <div className="muutoshakemus_taloudenKayttosuunnitelma_row" data-test-id="meno-input-row">
      <div className="description">{meno[`translation-${lang}`]}</div>
      <div className="existingAmount"><span className={amountClass}>{originalAmount}</span> €</div>
      <div className="separator" />
      <div className="changedAmount" data-test-id="meno-input">{meno.amount}</div>
      <div className="changedAmountEur">€</div>
    </div>
  )
}

export type MuutosTaloudenKayttosuunnitelmaanProps = {
  originalTalousarvio: Talousarvio
  muutoshakemus: Muutoshakemus
  lang: Language
}

export const MuutosTaloudenKayttosuunnitelmaan = ( props: MuutosTaloudenKayttosuunnitelmaanProps) => {
  const { originalTalousarvio, muutoshakemus, lang } = props
  const currentSum = muutoshakemus.talousarvio.reduce((acc: number, meno: Meno) => acc + meno.amount, 0)
  const originalSum = originalTalousarvio.reduce((acc: number, meno: Meno) => acc + meno.amount, 0)
  const talousarvio = muutoshakemus.talousarvio || []

  const isAccepted = ['accepted_with_changes', 'accepted'].includes(muutoshakemus.status)
  const originalTitle = isAccepted ? 'Vanha talousarvio' : 'Voimassaoleva talousarvio'
  const newTitle = isAccepted ? 'Uusi talousarvio' : 'Haetut muutokset'

  return (
    <section className="muutoshakemus-section">
      <div className="muutoshakemus-row">
        <div className="muutoshakemus__talousarvio">
          <div className="headerContainer">
            <h3 className="muutoshakemus__header currentBudget">{originalTitle}</h3>
            <h3 className="muutoshakemus__header">{newTitle}</h3>
          </div>
          <div className="expensesHeader">Menot</div>
          {talousarvio.map((meno: Meno) => <MenoRow lang={lang} meno={meno} key={meno["type"]} originalTalousarvio={originalTalousarvio} />)}
        </div>
        <hr className="muutoshakemus_taloudenKayttosuunnitelma_horizontalSeparator" />
        <div className="muutoshakemus_taloudenKayttosuunnitelma_row">
          <div className="description"></div>
          <div className="existingAmount" data-test-id="original-sum"><b>{originalSum} €</b></div>
          <div className="separator noborder" />
          <div className="changedAmount" data-test-id="current-sum"><b>{currentSum}</b></div>
          <div className="changedAmountEur"><b>€</b></div>
        </div>
      </div>
      <div className="muutoshakemus-row">
        <h4 className="muutoshakemus__header">Hakijan perustelut</h4>
        <div className="muutoshakemus__reason" data-test-id="muutoshakemus-talousarvio-perustelu">{muutoshakemus["talousarvio-perustelut"]}</div>
      </div>
    </section>
  )
}
