import React, { ChangeEvent } from 'react'

import {
  FormikHook,
  Meno,
  Talousarvio,
  TalousarvioValues,
} from 'soresu-form/web/va/types/muutoshakemus'
import { getNestedInputErrorClass } from 'soresu-form/web/va/formikHelpers'

import 'soresu-form/web/va/muutoshakemus/talous.css'

import { Language } from 'soresu-form/web/va/i18n/translations'
import { useTranslations } from 'soresu-form/web/va/i18n/TranslationContext'
import { PerustelutTextArea } from '../PerustelutTextArea'
import { ErrorMessage } from '../../ErrorMessage'

type MuutosTaloudenKayttosuunnitelmaanProps = {
  f: FormikHook
  talousarvio: Talousarvio
}

const calculateCurrentSum = (talousarvio: TalousarvioValues): number => {
  return Object.keys(talousarvio).reduce(
    (acc, cur) => (cur !== 'currentSum' && cur !== 'originalSum' ? acc + talousarvio[cur] : acc),
    0
  )
}

const MenoRow = ({ f, meno, lang }: { f: FormikHook; meno: Meno; lang: Language }) => {
  const name = `talousarvio.${meno.type}`
  const inputClass = getNestedInputErrorClass(f, ['talousarvio', meno.type])
  const value = f.values.talousarvio?.[meno.type]
  const amountClass = value === meno.amount ? '' : 'linethrough'

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    f.handleChange(e)
    if (f.values.talousarvio && !isNaN(parseInt(e.target.value))) {
      f.setFieldValue(
        'talousarvio.currentSum',
        calculateCurrentSum({
          ...f.values.talousarvio,
          [meno.type]: parseInt(e.target.value),
        })
      )
    }
  }

  return (
    <div className="muutoshakemus_talousarvio_row" data-test-id="meno-input-row">
      <div className="description meno-description">
        {meno[lang === 'fi' ? 'translation-fi' : 'translation-sv']}
      </div>
      <div className="existingAmount" data-test-id="current-value">
        <span className={amountClass}>{meno.amount}</span> €
      </div>
      <div className="separator" />
      <div className="changedAmount" data-test-id="meno-input">
        <input
          name={name}
          className={inputClass}
          type="number"
          onChange={handleChange}
          onBlur={f.handleBlur}
          value={value}
          min={0}
        />
      </div>
      <div className="changedAmountEur">€</div>
    </div>
  )
}

export const TalousarvioForm = ({ f, talousarvio }: MuutosTaloudenKayttosuunnitelmaanProps) => {
  const { t, lang } = useTranslations()
  // @ts-ignore Formik provides incorrect error type
  const currentSumErrorClass = f.errors.talousarvio?.currentSum ? 'currentSumError' : ''
  // @ts-ignore Formik provides incorrect error type
  const currentSum = f.errors.talousarvio?.currentSum
  const currentSumErrorElem = currentSum && <ErrorMessage text={currentSum} />
  return (
    <>
      <div className="muutoshakemus_talousarvio" data-test-id="talousarvio-form">
        <div className="headerContainer">
          <div className="currentBudget uppercase">
            {t.muutosTaloudenKayttosuunnitelmaan.currentBudget}
          </div>
          <div className="modifiedBudget uppercase">
            {t.muutosTaloudenKayttosuunnitelmaan.modifiedBudget}
          </div>
        </div>
        {talousarvio.map((meno: Meno) => (
          <MenoRow f={f} lang={lang} meno={meno} key={meno['type']} />
        ))}
      </div>
      <hr className="muutoshakemus_talousarvio_horizontalSeparator" />
      <div className="muutoshakemus_talousarvio_row">
        <div className="description" data-test-id="expenses-total-title">
          <b>{t.muutosTaloudenKayttosuunnitelmaan.expensesTotal}</b>
        </div>
        <div className="existingAmount" data-test-id="original-sum">
          <b>{f.values.talousarvio?.originalSum} €</b>
        </div>
        <div className="separator noborder" />
        <div className="changedAmount" data-test-id="current-sum">
          <b className={currentSumErrorClass}>{f.values.talousarvio?.currentSum}</b>
        </div>
        <div className="changedAmountEur">
          <b>€</b>
        </div>
      </div>
      <div className="muutoshakemus_talousarvio_row">
        <div className="description" />
        <div className="existingAmount" />
        <div className="separator noborder" />
        <div className="changedAmount" data-test-id="current-sum-error">
          {currentSumErrorElem}
        </div>
        <div className="changedAmountEur" />
      </div>
      <PerustelutTextArea f={f} name="taloudenKayttosuunnitelmanPerustelut" />
    </>
  )
}
