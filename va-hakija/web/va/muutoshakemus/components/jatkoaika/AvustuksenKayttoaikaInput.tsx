import React, {ChangeEvent, useEffect} from 'react'
import moment from 'moment'
import {useTranslations} from '../../TranslationContext'
import {
  AppContext,
  AvustuksenKayttoajanPidennys,
  SaveState
} from '../../store/context'
import {Types} from '../../store/reducers'

type AvustuksenKayttoaikaInputProps = {
  open: boolean
  nykyinenPaattymisPaiva: Date
}

export const AvustuksenKayttoaikaInput = (props: AvustuksenKayttoaikaInputProps) => {
  if (!props.open) return null

  const { t } = useTranslations()
  const { state, dispatch } = React.useContext(AppContext)

  useEffect(() => {
    if (props.open && !state.jatkoaika.localState?.haettuKayttoajanPaattymispaiva) {
      setUusiPaattymispaivaToState(defaultUusiPaattymisaika(props.nykyinenPaattymisPaiva))
    }
  }, [props.open])

  // TODO: Hae nykyinen tila kannasta ja esitäytä lomake.

  function toString(date: Date): string {
    return moment(date).format('DD.MM.YYYY')
  }

  function defaultUusiPaattymisaika(date: Date): string {
    return moment(date).add(2, 'months').format('YYYY-MM-DD')
  }

  function getPaattymispaivaFromStateOrDefault() {
    return state.jatkoaika.localState?.haettuKayttoajanPaattymispaiva ||
          defaultUusiPaattymisaika(props.nykyinenPaattymisPaiva)
  }

  function onChangePerustelut(event: ChangeEvent<HTMLTextAreaElement>): void {
    setPerustelutToState(event.currentTarget.value)
  }

  function onChangeDate(event: ChangeEvent<HTMLInputElement>): void {
    setUusiPaattymispaivaToState(event.currentTarget.value)
  }

  function setPerustelutToState(perustelut: string) {
    dispatch({
      type: Types.JatkoaikaFormChange,
      payload: { formState: { kayttoajanPidennysPerustelut: perustelut } }
    })
  }

  function setUusiPaattymispaivaToState(paiva: string) {
    dispatch({
      type: Types.JatkoaikaFormChange,
      payload: { formState: { haettuKayttoajanPaattymispaiva: paiva } }
    })
  }

  function hasInputValidationError(name: keyof AvustuksenKayttoajanPidennys): boolean {
    if (state.jatkoaika.lastSave.status !== SaveState.SAVE_FAILED) return false
    if (!state.jatkoaika.errorState) return false

    const { errorState: error } = state.jatkoaika
    return 'response' in error && error.response?.data.errors?.[name] !== undefined
  }

  function hasDateError(): boolean {
    return hasInputValidationError('haettuKayttoajanPaattymispaiva')
  }

  function hasPerusteluError(): boolean {
    return hasInputValidationError('kayttoajanPidennysPerustelut')
  }

  const datePattern = '[0-9]{4}-[0-9]{2}-[0-9]{2}'

  return (
    <div>
      <div className="input twocolumns">
        <div>
          <div className="h3">{t.kayttoajanPidennys.existingExpirationDateTitle}</div>
          <div className="paattymispaiva">{toString(props.nykyinenPaattymisPaiva)}</div>
        </div>
        <div>
          <label className='h3' htmlFor="input-haluttu-paattymispaiva">
            {t.kayttoajanPidennys.newExpirationDateTitle}
          </label>
          <div className="paattymispaiva">
            <input
              className={hasDateError() ? 'error' : ''}
              id="input-haluttu-paattymispaiva"
              onChange={onChangeDate}
              placeholder="yyyy-mm-dd"
              pattern={datePattern}
              type="date"
              value={getPaattymispaivaFromStateOrDefault()} />
          </div>
        </div>
      </div>
      <div className="textareacontainer">
        <label htmlFor="perustelut-jatkoaika">{t.kayttoajanPidennys.reasonsTitle}</label>
        <textarea
          id="perustelut-jatkoaika"
          className={hasPerusteluError() ? 'error' : ''}
          rows={5}
          onChange={onChangePerustelut}
          value={state.jatkoaika.localState?.kayttoajanPidennysPerustelut}
        />
      </div>
    </div>
  )
}
