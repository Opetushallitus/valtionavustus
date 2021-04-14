import React from 'react'
import { Translations } from '../../types/muutoshakemus'

type PerustelutTextAreaProps = {
  name: 'kayttoajanPidennysPerustelut' | 'taloudenKayttosuunnitelmanPerustelut'
  value?: string
  t: Translations
}

export const PerustelutTextArea = ({ name, value, t }: PerustelutTextAreaProps) => {
  const id = `readonly-perustelut-${name}`

  return (
    <div className="muutoshakemus__perustelut">
      <label htmlFor={id}>{t.applicationEdit.reasoning}</label>
      <textarea
        id={id}
        disabled={true}
        name={name}
        rows={5}
        cols={53}
        value={value}
      />
    </div>
  )
}
