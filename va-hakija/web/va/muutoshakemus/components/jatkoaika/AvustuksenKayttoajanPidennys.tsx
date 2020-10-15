import React, { useState } from 'react'
import {
  AvustuksenKayttoaikaInput,
  UserInputs
} from './AvustuksenKayttoaikaInput'
import './jatkoaika.less'

type AvustuksenKayttoajanPidennysProps = {
  nykyinenPaattymisaika: Date
}

// TODO: Tekstit pois täältä!

export const AvustuksenKayttoajanPidennys = (props: AvustuksenKayttoajanPidennysProps) => {

  const [ isInputOpen, setInputOpen ] = useState(false)

  function toggleOpen() {
    setInputOpen(!isInputOpen)
  }

  function handleInputChange(inputs: UserInputs) {
    console.log(JSON.stringify(inputs)) // TODO: Käsittele kentät
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
            onChange={handleInputChange}
            nykyinenPaattymisaika={props.nykyinenPaattymisaika} />

        </form>
      </div>
    </section>
  )
}
