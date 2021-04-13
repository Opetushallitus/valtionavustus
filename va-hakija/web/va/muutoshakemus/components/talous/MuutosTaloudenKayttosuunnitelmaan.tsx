import React from 'react'

import { FormikHook, Meno, Talousarvio, TalousarvioValues } from 'va-common/web/va/types/muutoshakemus'

import './talous.less'
import { Language } from '../../translations'
import { useTranslations } from '../../TranslationContext'
import { PerustelutTextArea } from '../PerustelutTextArea'
import { getNestedInputErrorClass } from '../../formikHelpers'
import { ErrorMessage } from '../../ErrorMessage'

type MuutosTaloudenKayttosuunnitelmaanProps = {
  f: FormikHook
  talousarvio: Talousarvio
}

const calculateCurrentSum = (talousarvio: TalousarvioValues): number => {
  return Object.keys(talousarvio).reduce((acc, cur) => (cur !== 'currentSum' && cur !== 'originalSum') ? acc + talousarvio[cur] : acc, 0)
}

const MenoRow = ({ f, meno, lang }: { f: FormikHook, meno: Meno, lang: Language }) => {
  const name = `talousarvio.${meno.type}`
  const inputClass = getNestedInputErrorClass(f, ['talousarvio', meno.type])
  const value = f.values.talousarvio?.[meno.type]
  const amountClass = value === meno.amount ? '' : 'linethrough'

  const handleChange = (e) => {
    f.handleChange(e)
    if (f.values.talousarvio && !isNaN(parseInt(e.target.value))) {
      f.setFieldValue('talousarvio.currentSum', calculateCurrentSum({ ...f.values.talousarvio, [meno.type]: parseInt(e.target.value) }))
    }
  }

  return (
    <div className="muutoshakemus_taloudenKayttosuunnitelma_row" data-test-id="meno-input-row">
      <div className="description">{meno[`translation-${lang}`]}</div>
      <div className="existingAmount"><span className={amountClass}>{meno.amount}</span> €</div>
      <div className="separator" />
      <div className="changedAmount" data-test-id="meno-input">
        <input name={name} className={inputClass} type="number" onChange={handleChange} onBlur={f.handleBlur} value={value} />
      </div>
      <div className="changedAmountEur">€</div>
    </div>
  )
}

export const MuutosTaloudenKayttosuunnitelmaan = ({ f, talousarvio }: MuutosTaloudenKayttosuunnitelmaanProps) => {
  const { t, lang } = useTranslations()
  // @ts-ignore Formik provides incorrect error type
  const currentSumErrorClass = f.errors.talousarvio?.currentSum ? 'currentSumError' : ''
  // @ts-ignore Formik provides incorrect error type
  const currentSumErrorElem = f.errors.talousarvio?.currentSum && <ErrorMessage text={f.errors.talousarvio?.currentSum} />
  return (
    <>
      <div className="muutoshakemus_taloudenKayttosuunnitelma">
        <div className="headerContainer">
          <div className="currentBudget">{t.muutosTaloudenKayttosuunnitelmaan.currentBudget}</div>
          <div className="modifiedBudget">{t.muutosTaloudenKayttosuunnitelmaan.modifiedBudget}</div>
        </div>
        <div className="expensesHeader">{t.muutosTaloudenKayttosuunnitelmaan.expenses}</div>
        {talousarvio.map((meno: Meno) => <MenoRow f={f} lang={lang} meno={meno} key={meno["type"]} />)}
      </div>
      <hr className="muutoshakemus_taloudenKayttosuunnitelma_horizontalSeparator" />
      <div className="muutoshakemus_taloudenKayttosuunnitelma_row">
        <div className="description"><b>{t.muutosTaloudenKayttosuunnitelmaan.expensesTotal}</b></div>
        <div className="existingAmount" data-test-id="original-sum"><b>{f.values.talousarvio?.originalSum} €</b></div>
        <div className="separator noborder" />
        <div className="changedAmount" data-test-id="current-sum"><b className={currentSumErrorClass}>{f.values.talousarvio?.currentSum}</b></div>
        <div className="changedAmountEur"><b>€</b></div>
      </div>
      <div className="muutoshakemus_taloudenKayttosuunnitelma_row">
        <div className="description" />
        <div className="existingAmount" />
        <div className="separator noborder" />
        <div className="changedAmount" data-test-id="current-sum-error">{currentSumErrorElem}</div>
        <div className="changedAmountEur" />
      </div>
      <PerustelutTextArea f={f} name='taloudenKayttosuunnitelmanPerustelut' />
    </>
  )
}
