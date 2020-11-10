import React from 'react'
import { AvustuksenKayttoaikaInput } from './AvustuksenKayttoaikaInput'
import './jatkoaika.less'
import {useTranslations} from '../../TranslationContext'
import {AppContext} from '../../store/context'
import {Types} from '../../store/reducers'

type AvustuksenKayttoajanPidennysProps = {
  nykyinenPaattymisPaiva: Date
}

export const AvustuksenKayttoajanPidennys = (props: AvustuksenKayttoajanPidennysProps) => {
  const { t } = useTranslations()
  const { state, dispatch } = React.useContext(AppContext)

  function toggleHaenKayttoajanPidennysta() {
    dispatch({
      type: Types.JatkoaikaFormChange,
      payload: { formState: {
        haenKayttoajanPidennysta: !state.jatkoaika?.haenKayttoajanPidennysta,
      }}
    })
  }

  return (
    <section className="section" id="section-muutosten-hakeminen-checkbox">
      <h2>{t.applicationEdit.title}</h2>
      <div className="content muutoksenhaku">
        <form>

          <div className="checkbox-jatkoaika-container">
            <input type="checkbox" value="Submit" id="checkbox-jatkoaika" onClick={toggleHaenKayttoajanPidennysta} />
            <label htmlFor="checkbox-jatkoaika">
              {t.kayttoajanPidennys.checkboxTitle}
            </label>
          </div>

          <AvustuksenKayttoaikaInput
            open={!!state.jatkoaika?.haenKayttoajanPidennysta}
            nykyinenPaattymisPaiva={props.nykyinenPaattymisPaiva} />

        </form>
      </div>
    </section>
  )
}
