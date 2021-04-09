import React from 'react'

import { FormikHook, Meno, Talousarvio } from 'va-common/web/va/types/muutoshakemus'

import './talous.less'
import { Language } from '../../translations'
import { useTranslations } from '../../TranslationContext'
import { PerustelutTextArea } from '../PerustelutTextArea'
import { getNestedInputErrorClass } from '../../formikHelpers'

type MuutosTaloudenKayttosuunnitelmaanProps = {
  f: FormikHook
  talousarvio: Talousarvio
}

const MenoRow = ({ f, meno, lang }: { f: FormikHook, meno: Meno, lang: Language }) => {
  const name = `talousarvio.${meno.type}`
  const className = getNestedInputErrorClass(f, ['talousarvio', meno.type])
  const value = f.values.talousarvio?.[meno.type]

  return (
    <div className="muutoshakemus_taloudenKayttosuunnitelma_row">
      <div className="description">{meno[`translation-${lang}`]}</div>
      <div className="existingAmount">{meno.amount} €</div>
      <div className="separator" />
      <div className="changedAmount">
        <input name={name} className={className} type="text" onChange={f.handleChange} onBlur={f.handleBlur} value={value} /> €
      </div>
    </div>
  )
}

export const MuutosTaloudenKayttosuunnitelmaan = ({ f, talousarvio }: MuutosTaloudenKayttosuunnitelmaanProps) => {
  const { t, lang } = useTranslations()
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
      <PerustelutTextArea f={f} name='taloudenKayttosuunnitelmanPerustelut' />
    </>
  )
}
