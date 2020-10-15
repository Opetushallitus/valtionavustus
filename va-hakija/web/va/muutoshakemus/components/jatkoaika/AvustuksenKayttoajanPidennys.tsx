import React, { useState } from 'react'
import {
  AvustuksenKayttoaikaInput,
  UserInputs
} from './AvustuksenKayttoaikaInput'
import './jatkoaika.less'

type AvustuksenKayttoajanPidennysProps = {
  nykyinenPaattymisaika: Date
  onChange: (inputs: UserInputs) => void
}

// TODO: Tekstit pois täältä!

export const AvustuksenKayttoajanPidennys = (props: AvustuksenKayttoajanPidennysProps) => {

  const [ isInputOpen, setInputOpen ] = useState(false)

  function toggleOpen() {
    setInputOpen(!isInputOpen)
  }

  return (
    <section className="section" id="section-muutosten-hakeminen-checkbox">
      <h2>Muutosten hakeminen</h2>
      <div className="content muutoksenhaku">
        <form>

          <div className="checkbox-jatkoaika-container">
            <input type="checkbox" value="Submit" id="checkbox-jatkoaika" onClick={toggleOpen} />
            <label htmlFor="checkbox-jatkoaika">
              Haen pidennystä avustuksen käyttöajalle
            </label>
          </div>

          <AvustuksenKayttoaikaInput
            open={isInputOpen}
            onChange={props.onChange}
            nykyinenPaattymisaika={props.nykyinenPaattymisaika} />

        </form>
      </div>
    </section>
  )
}
