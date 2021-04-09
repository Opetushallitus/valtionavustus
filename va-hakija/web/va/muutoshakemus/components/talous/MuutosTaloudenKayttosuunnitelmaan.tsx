import React from 'react'

import { FormikHook, Meno, Talousarvio } from 'va-common/web/va/types/muutoshakemus'

import './talous.less'
import { Language } from '../../translations'
import { useTranslations } from '../../TranslationContext'
import { PerustelutTextArea } from '../PerustelutTextArea'

type MuutosTaloudenKayttosuunnitelmaanProps = {
  f: FormikHook
  talousarvio: Talousarvio
}

const MenoRow = ({ meno, lang }: { meno: Meno, lang: Language }) => {

  return (
    <div className="muutoshakemus_taloudenKayttosuunnitelma_row">
      <div className="description">{meno[`translation-${lang}`]}</div>
      <div className="existingAmount">{meno.amount} €</div>
      <div className="separator" />
      <div className="changedAmount">
        <input type="text" /> €
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
        {talousarvio.map(meno => <MenoRow lang={lang} meno={meno} key={meno["type"]} />)}
      </div>
      <PerustelutTextArea f={f} name='taloudenKayttosuunnitelmanPerustelut' />
    </>
  )
}
