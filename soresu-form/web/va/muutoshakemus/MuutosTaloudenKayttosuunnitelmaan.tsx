import React from 'react'

import { Meno, PaatosStatus, Talousarvio } from 'soresu-form/web/va/types/muutoshakemus'
import { useTranslations } from '../i18n/TranslationContext'
import { isAcceptedWithOrWithoutChanges } from '../Muutoshakemus'
import { OsioPaatos } from '../OsioPaatos'

import './talous.css'

type MenoRowProps = {
  meno: Meno
  talousarvio?: { [key: string]: number }
  currentTalousarvio: Talousarvio
  linethrough: boolean
  odd: boolean
}

const MenoRow = ({ meno, currentTalousarvio, linethrough, odd }: MenoRowProps) => {
  const { lang } = useTranslations()
  const currentAmount = currentTalousarvio.find((t) => t.type === meno.type)?.amount
  const amountClass =
    meno.amount === currentAmount || !linethrough ? '' : 'meno-amount--linethrough'

  return (
    <div
      className={`meno-row ${odd ? '' : `meno-row-even`}`}
      data-test-id="meno-input-row"
      data-test-type={meno.type}
    >
      <div className="meno-description">
        {meno[lang === 'fi' ? 'translation-fi' : 'translation-sv']}
      </div>
      <div className="meno-amount" data-test-id="current-value">
        <span className={amountClass}>{currentAmount} €</span>
      </div>
      <div className="meno-amount" data-test-id="muutoshakemus-value">
        {meno.amount} €
      </div>
    </div>
  )
}

export type MuutosTaloudenKayttosuunnitelmaanProps = {
  currentTalousarvio: Talousarvio
  newTalousarvio: Talousarvio
  status: PaatosStatus | null
  reason?: string
}

export const TalousarvioTable = (
  props: MuutosTaloudenKayttosuunnitelmaanProps & { paatos?: boolean }
) => {
  const { currentTalousarvio, status, newTalousarvio, paatos } = props
  const { t } = useTranslations()
  const muutoshakemusSum = newTalousarvio.reduce((acc: number, meno: Meno) => acc + meno.amount, 0)
  const currentSum = currentTalousarvio.reduce((acc: number, meno: Meno) => acc + meno.amount, 0)
  const isAccepted = isAcceptedWithOrWithoutChanges(status)

  return (
    <div className="talousarvio" data-accepted={isAccepted ? 'true' : 'false'}>
      <div className="talousarvio_header">
        <h4 className="talousarvio_header-column" data-test-id="budget-old-title">
          {t.muutosTaloudenKayttosuunnitelmaan.budget.budgetOriginalTitle(isAccepted)}
        </h4>
        <h4 className="talousarvio_header-column" data-test-id="budget-change-title">
          {t.muutosTaloudenKayttosuunnitelmaan.budget.budgetChangeTitle(isAccepted)}
        </h4>
      </div>
      <div className="talousarvio_rows">
        {newTalousarvio.map((meno: Meno, idx: number) => (
          <MenoRow
            linethrough={!paatos}
            meno={meno}
            key={meno['type']}
            currentTalousarvio={currentTalousarvio}
            odd={!(idx % 2)}
          />
        ))}
        <div className={`summary-row ${newTalousarvio.length % 2 ? 'meno-row-even' : ''}`}>
          <div className="meno-description" />
          <div className="meno-amount" data-test-id="current-sum">
            {currentSum} €
          </div>
          <div className="meno-amount" data-test-id="muutoshakemus-sum">
            {muutoshakemusSum} €
          </div>
        </div>
      </div>
    </div>
  )
}

export const MuutosTaloudenKayttosuunnitelmaan = (
  props: MuutosTaloudenKayttosuunnitelmaanProps
) => {
  const { reason, status } = props
  const { t } = useTranslations()

  return (
    <React.Fragment>
      <TalousarvioTable {...props} />
      <div className="muutoshakemus-row">
        <h4 className="muutoshakemus__header" data-test-id="reasoning-title">
          {t.muutosTaloudenKayttosuunnitelmaan.applicantReasoning}
        </h4>
        <div
          className="muutoshakemus-description-box"
          data-test-id="muutoshakemus-talousarvio-perustelu"
        >
          {reason}
        </div>
      </div>
      {status && (
        <div className="muutoshakemus-row">
          <OsioPaatos osio="paatos-talousarvio" paatosStatus={status} />
        </div>
      )}
    </React.Fragment>
  )
}
