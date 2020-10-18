import React, { useState, useEffect } from 'react'
import moment from 'moment'
import {ChangeEvent} from 'react'
import {useTranslations} from '../../TranslationContext'

type AvustuksenKayttoaikaInputProps = {
  open: boolean
  nykyinenPaattymisaika: Date
  onChange: (inputs: UserInputs) => void
}

export type UserInputs = {
  toivottuPaattymispaiva?: string
  perustelut?: string
}

// TODO: Tekstit pois ja käännöksiin

export const AvustuksenKayttoaikaInput = (props: AvustuksenKayttoaikaInputProps) => {
  if (!props.open) return null

  // TODO: Hae nykyinen tila kannasta ja esitäytä lomake.

  const { t } = useTranslations()
  const [ toivottuPaattymispaiva, setToivottuPaattymispaiva ] = useState(
    defaultUusiPaattymisaika(props.nykyinenPaattymisaika))

  const [ perustelut, setPerustelut ] = useState<string>()
  const [ dateError, setDateError ] = useState(false)
  const [ textError, setTextError ] = useState(false)


  useEffect(() => {
    props.onChange({
      perustelut: perustelut,
      toivottuPaattymispaiva: toivottuPaattymispaiva,
    })
  }, [toivottuPaattymispaiva, perustelut])

  function toString(date: Date): string {
    return moment(date).format('DD.MM.YYYY')
  }

  function defaultUusiPaattymisaika(date: Date): string {
    return moment(date).add(2, 'months').format('YYYY-MM-DD')
  }

  function onChangePerustelut(event: ChangeEvent<HTMLTextAreaElement>): void {
    setPerustelut(event.currentTarget.value)
  }

  function onChangeDate(event: ChangeEvent<HTMLInputElement>): void {
    setToivottuPaattymispaiva(event.currentTarget.value)
  }

  const datePattern = '[0-9]{4}-{0-9}[2]-{0-9}[2]'

  return (
    <div>
      <div className="input twocolumns">
        <div>
          <div className="h3">{t.kayttoajanPidennys.existingExpirationDateTitle}</div>
          <div className="paattymispaiva">{toString(props.nykyinenPaattymisaika)}</div>
        </div>
        <div>
          <label className='h3' htmlFor="input-haluttu-paattymispaiva">
            {t.kayttoajanPidennys.newExpirationDateTitle}
          </label>
          <div className="paattymispaiva">
            <input
              className={dateError ? 'error' : ''}
              id="input-haluttu-paattymispaiva"
              onChange={onChangeDate}
              placeholder="yyyy-mm-dd"
              pattern={datePattern}
              type="date"
              defaultValue={defaultUusiPaattymisaika(props.nykyinenPaattymisaika)} />
          </div>
        </div>
      </div>
      <div className="textareacontainer">
        <label htmlFor="perustelut-jatkoaika">{t.kayttoajanPidennys.reasonsTitle}</label>
        <textarea
          id="perustelut-jatkoaika"
          className={textError ? 'error' : ''}
          rows={5}
          onChange={onChangePerustelut} />
      </div>
    </div>
  )
}
