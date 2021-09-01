import React from 'react'

import { Meno, MuutoshakemusStatus, Talousarvio } from 'va-common/web/va/types/muutoshakemus'
import { useTranslations } from '../i18n/TranslationContext'

import './talous.less'
import {MuutoshakemusSection} from "../MuutoshakemusSection";

type MenoRowProps = {
  meno: Meno
  talousarvio?: { [key: string]: number }
  currentTalousarvio: Talousarvio
  linethrough: boolean
}

const MenoRow = ({ meno, currentTalousarvio, linethrough }: MenoRowProps) => {
  const { lang } = useTranslations()
  const currentAmount = currentTalousarvio.find(t => t.type === meno.type)?.amount
  const amountClass = meno.amount === currentAmount || !linethrough ? '' : 'linethrough'

  return (
    <div className="muutoshakemus_talousarvio_row" data-test-id="meno-input-row" data-test-type={meno.type}>
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
  newTalousarvio: Talousarvio
  status: MuutoshakemusStatus
  reason?: string
  paatos?: boolean
}

export const TalousarvioTable = (props: MuutosTaloudenKayttosuunnitelmaanProps) => {
  const { currentTalousarvio, status, newTalousarvio, paatos } = props
  const { t } = useTranslations()
  const muutoshakemusSum = newTalousarvio.reduce((acc: number, meno: Meno) => acc + meno.amount, 0)
  const currentSum = currentTalousarvio.reduce((acc: number, meno: Meno) => acc + meno.amount, 0)

  const isAccepted = ['accepted_with_changes', 'accepted'].includes(status)
  const headerClass = paatos ? 'muutoshakemus-paatos__change-header' : 'muutoshakemus__header'
  const wrapperClass = paatos ? 'muutoshakemus-paatos__talousarvio' : 'muutoshakemus-row'

  return (
    <div className={wrapperClass}>
      <div className="muutoshakemus_talousarvio" data-accepted={isAccepted ? 'true' : 'false'}>
        <div className="headerContainer">
          <h3 className={`${headerClass} currentBudget`}>{t.muutosTaloudenKayttosuunnitelmaan.budget.budgetOriginalTitle(isAccepted)}</h3>
          <h3 className={headerClass} data-test-id='budget-change-title'>{t.muutosTaloudenKayttosuunnitelmaan.budget.budgetChangeTitle(isAccepted)}</h3>
        </div>
        {newTalousarvio.map((meno: Meno) => <MenoRow linethrough={!paatos} meno={meno} key={meno["type"]} currentTalousarvio={currentTalousarvio} />)}
      </div>
      <hr className="muutoshakemus_talousarvio_horizontalSeparator" />
      <div className="muutoshakemus_talousarvio_row">
        <div className="description" data-test-id="expenses-total-title">{paatos && <b>{t.muutosTaloudenKayttosuunnitelmaan.expensesTotal}</b>}</div>
        <div className="existingAmount" data-test-id="current-sum"><b>{currentSum} €</b></div>
        <div className="separator noborder" />
        <div className="changedAmount" data-test-id="muutoshakemus-sum"><b>{muutoshakemusSum}</b></div>
        <div className="changedAmountEur"><b>€</b></div>
      </div>
    </div>
  )
}

export const MuutosTaloudenKayttosuunnitelmaan = (props: MuutosTaloudenKayttosuunnitelmaanProps) => {
  const { reason } = props
  const { t } = useTranslations()

  return (
    <MuutoshakemusSection>
      <TalousarvioTable {...props} />
      <div className="muutoshakemus-row">
        <h4 className="muutoshakemus__header" data-test-id="reasoning-title">{t.muutosTaloudenKayttosuunnitelmaan.applicantReasoning}</h4>
        <div className="muutoshakemus__reason" data-test-id="muutoshakemus-talousarvio-perustelu">{reason}</div>
      </div>
    </MuutoshakemusSection>
  )
}
