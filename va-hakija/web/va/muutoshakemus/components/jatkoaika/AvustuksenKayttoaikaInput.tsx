import React, { useState, useEffect } from 'react'
import moment from 'moment'
import {ChangeEvent} from 'react'
import {debounce} from 'lodash'
import {haeJatkoaikaa} from '../../client'

type AvustuksenKayttoaikaInputProps = {
  open: boolean
  nykyinenPaattymisaika: Date
  onChange: (inputs: UserInputs) => void
}

export type UserInputs = {
  toivottuPaattymispaiva: string
  perustelut: string
}

const debounce_wait = 1000 // 1 second

// TODO: Tekstit pois ja käännöksiin

export const AvustuksenKayttoaikaInput = (props: AvustuksenKayttoaikaInputProps) => {
  if (!props.open) return null

  // Fixme: Autosave pois ja tallennus vanhempien komponenttiin!
  // TODO: Hae nykyinen tila kannasta ja esitäytä lomake.

  const [ toivottuPaattymispaiva, setToivottuPaattymispaiva ] = useState(
    defaultUusiPaattymisaika(props.nykyinenPaattymisaika))

  const [ perustelut, setPerustelut ] = useState<string>()
  const [ unsavedChanges, setUnsavedChanges ] = useState(false)
  const [ dateError, setDateError ] = useState(false)
  const [ textError, setTextError ] = useState(false)

  const debouncedSave = debounce(() => autoSave(), debounce_wait)
  useEffect(() => { debouncedSave() }, [toivottuPaattymispaiva, perustelut])

  async function autoSave(): Promise<void> {
    if (!unsavedChanges) return

    try {
      await haeJatkoaikaa({
        toivottuPaattymispaiva: toivottuPaattymispaiva,
        perustelut: perustelut
      })
      setDateError(false)
      setTextError(false)
      setUnsavedChanges(false)
    } catch (e) {
      if (e?.response?.data?.errors?.toivottuPaattymispaiva !== undefined) {
        setDateError(true)
      }
      if (e?.response?.data?.errors?.perustelut !== undefined) {
        setTextError(true)
      }
      setUnsavedChanges(true)
    }
  }

  function toString(date: Date): string {
    return moment(date).format('DD.MM.YYYY')
  }

  function defaultUusiPaattymisaika(date: Date): string {
    return moment(date).add(2, 'months').format('YYYY-MM-DD')
  }

  function onChangePerustelut(event: ChangeEvent<HTMLTextAreaElement>): void {
    setUnsavedChanges(true)
    setPerustelut(event.currentTarget.value)
  }

  function onChangeDate(event: ChangeEvent<HTMLInputElement>): void {
    setUnsavedChanges(true)
    setToivottuPaattymispaiva(event.currentTarget.value)
  }

  const datePattern = '[0-9]{4}-{0-9}[2]-{0-9}[2]'

  return (
    <div>
      <div className="input twocolumns">
        <div>
          <div className="h3">Voimassaoleva päättymisaika</div>
          <div className="paattymispaiva">{toString(props.nykyinenPaattymisaika)}</div>
        </div>
        <div>
          <label className='h3' htmlFor="input-haluttu-paattymispaiva">Uusi päättymisaika</label>
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
        <label htmlFor="perustelut-jatkoaika">Perustelut</label>
        <textarea
          id="perustelut-jatkoaika"
          className={textError ? 'error' : ''}
          rows={5}
          onChange={onChangePerustelut} />
      </div>
    </div>
  )
}
