import React from 'react'

import { Language, Meno, Muutoshakemus, Talousarvio } from 'va-common/web/va/types/muutoshakemus'

import './talous.less'

type MenoRowProps = {
  meno: Meno
  lang: Language
  talousarvio?: { [key: string]: number }
  currentTalousarvio: Talousarvio
}

const MenoRow = ({ meno, lang, currentTalousarvio }: MenoRowProps) => {
  const currentAmount = currentTalousarvio.find(t => t.type === meno.type)?.amount
  const amountClass = meno.amount === currentAmount ? '' : 'linethrough'

  return (
    <div className="muutoshakemus_talousarvio_row" data-test-id="meno-input-row">
      <div className="description">{meno[`translation-${lang}`]}</div>
      <div className="existingAmount"><span className={amountClass}>{currentAmount}</span> €</div>
      <div className="separator" />
      <div className="changedAmount" data-test-id="meno-input">{meno.amount}</div>
      <div className="changedAmountEur">€</div>
    </div>
  )
}

export type MuutosTaloudenKayttosuunnitelmaanProps = {
  currentTalousarvio: Talousarvio
  muutoshakemus: Muutoshakemus
  lang: Language
}

export const MuutosTaloudenKayttosuunnitelmaan = (props: MuutosTaloudenKayttosuunnitelmaanProps) => {
  const { currentTalousarvio, muutoshakemus, lang } = props
  const muutoshakemusSum = muutoshakemus.talousarvio.reduce((acc: number, meno: Meno) => acc + meno.amount, 0)
  const currentSum = currentTalousarvio.reduce((acc: number, meno: Meno) => acc + meno.amount, 0)

  const isAccepted = ['accepted_with_changes', 'accepted'].includes(muutoshakemus.status)
  const originalTitle = isAccepted ? 'Vanha talousarvio' : 'Voimassaoleva talousarvio'
  const newTitle = isAccepted ? 'Hyväksytyt muutokset' : 'Haetut muutokset'

  return (
    <section className="muutoshakemus-section">
      <div className="muutoshakemus-row">
        <div className="muutoshakemus_talousarvio">
          <div className="headerContainer">
            <h3 className="muutoshakemus__header currentBudget">{originalTitle}</h3>
            <h3 className="muutoshakemus__header">{newTitle}</h3>
          </div>
          <div className="expensesHeader">Menot</div>
          {muutoshakemus.talousarvio.map((meno: Meno) => <MenoRow lang={lang} meno={meno} key={meno["type"]} currentTalousarvio={currentTalousarvio} />)}
        </div>
        <hr className="muutoshakemus_talousarvio_horizontalSeparator" />
        <div className="muutoshakemus_talousarvio_row">
          <div className="description"></div>
          <div className="existingAmount" data-test-id="current-sum"><b>{currentSum} €</b></div>
          <div className="separator noborder" />
          <div className="changedAmount" data-test-id="muutoshakemus-sum"><b>{muutoshakemusSum}</b></div>
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
