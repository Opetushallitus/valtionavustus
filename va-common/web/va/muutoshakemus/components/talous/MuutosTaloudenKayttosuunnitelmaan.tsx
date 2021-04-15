import React from 'react'
import {
  Language,
  Meno,
  Translations,
  Muutoshakemus, Talousarvio
} from 'va-common/web/va/types/muutoshakemus'

import './talous.less'
import { PerustelutTextArea } from '../PerustelutTextArea'

type MenoRowProps = {
  meno: Meno
  lang: Language
  talousarvio?: { [key: string]: number }
  originalTalousarvio: Talousarvio
}

const MenoRow = ({ talousarvio, meno, lang, originalTalousarvio }: MenoRowProps) => {
  const name = `talousarvio.${meno.type}`
  const value = talousarvio?.[meno.type]
  const amountClass = value === meno.amount ? '' : 'linethrough'
  const originalAmount = originalTalousarvio.find(t => t.type === meno.type)?.amount

  return (
    <div className="muutoshakemus_taloudenKayttosuunnitelma_row" data-test-id="meno-input-row">
      <div className="description">{meno[`translation-${lang}`]}</div>
      <div className="existingAmount"><span className={amountClass}>{originalAmount}</span> €</div>
      <div className="separator" />
      <div className="changedAmount" data-test-id="meno-input">
        <input disabled={true} name={name} type="number" value={meno.amount} />
      </div>
      <div className="changedAmountEur">€</div>
    </div>
  )
}

export type MuutosTaloudenKayttosuunnitelmaanProps = {
  originalTalousarvio: Talousarvio
  muutoshakemus: Muutoshakemus
  lang: Language
  t: Translations
}

export const MuutosTaloudenKayttosuunnitelmaan = ( props: MuutosTaloudenKayttosuunnitelmaanProps) => {
  const { originalTalousarvio, muutoshakemus, lang, t } = props

  if (!muutoshakemus.talousarvio || muutoshakemus.talousarvio.length < 1) return null
  if (!originalTalousarvio || originalTalousarvio.length < 1) return null

  const currentSum = muutoshakemus.talousarvio.reduce((acc: number, meno: Meno) => acc + meno.amount, 0)
  const originalSum = originalTalousarvio.reduce((acc: number, meno: Meno) => acc + meno.amount, 0)
  const talousarvio = muutoshakemus.talousarvio || []

  return (
    <section className="muutoshakemus-section">
      <div className="muutoshakemus_taloudenKayttosuunnitelma">
        <div className="headerContainer">
          <div className="currentBudget">{t.muutosTaloudenKayttosuunnitelmaan.currentBudget}</div>
          <div className="modifiedBudget">{t.muutosTaloudenKayttosuunnitelmaan.modifiedBudget}</div>
        </div>
        <div className="expensesHeader">{t.muutosTaloudenKayttosuunnitelmaan.expenses}</div>
        {talousarvio.map((meno: Meno) => <MenoRow lang={lang} meno={meno} key={meno["type"]} originalTalousarvio={originalTalousarvio} />)}
      </div>
      <hr className="muutoshakemus_taloudenKayttosuunnitelma_horizontalSeparator" />
      <div className="muutoshakemus_taloudenKayttosuunnitelma_row">
        <div className="description"><b>{t.muutosTaloudenKayttosuunnitelmaan.expensesTotal}</b></div>
        <div className="existingAmount" data-test-id="original-sum"><b>{originalSum} €</b></div>
        <div className="separator noborder" />
        <div className="changedAmount" data-test-id="current-sum"><b>{currentSum}</b></div>
        <div className="changedAmountEur"><b>€</b></div>
      </div>
      <div className="muutoshakemus_taloudenKayttosuunnitelma_row">
        <div className="description" />
        <div className="existingAmount" />
        <div className="separator noborder" />
        <div className="changedAmountEur" />
      </div>

      <PerustelutTextArea
        name='taloudenKayttosuunnitelmanPerustelut'
        value={muutoshakemus["talousarvio-perustelut"]}
        t={t} />

    </section>
  )
}
