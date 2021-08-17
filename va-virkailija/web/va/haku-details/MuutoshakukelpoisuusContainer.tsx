import React, { useState } from 'react'

import 'react-widgets/styles.css'

import "./Muutoshakukelpoisuus.less"

interface Field {
  id: string
  label?: string
}

interface Muutoshakukelpoisuus {
    "is-ok": boolean
    "ok-fields": Field[]
    "erroneous-fields": Field[]
}

interface MuutoshakukelpoisuusWarningProps {
  muutoshakukelpoisuus: Muutoshakukelpoisuus
  controlDropdown: () => void
}

export const MuutoshakukelpoisuusWarning = ( {muutoshakukelpoisuus, controlDropdown}: MuutoshakukelpoisuusWarningProps) => {

  const numberOfErrors = muutoshakukelpoisuus["erroneous-fields"].length
  const warningText = numberOfErrors > 1
    ? `Lomakkeesta puuttuu ${numberOfErrors} muutoshakemukselle tarpeellista kenttää. Muutoshaku ei ole mahdollista.`
    : `Lomakkeesta puuttuu muutoshakemukselle tarpeellinen kenttä. Muutoshaku ei ole mahdollista.`
  return (
    <div className="muutoshakukelpoisuus-warning" >
      <div>
        {warningText}
      </div>
      <div className="muutoshakukelpoisuus-warning-button" onClick={controlDropdown}>
        <u>Näytä lisätietoja</u>
      </div>
    </div>
  )
}

interface MuutoshakukelpoisuusDropdownProps {
  muutoshakukelpoisuus: Muutoshakukelpoisuus
}

const MuutoshakukelpoisuusDropdown = ({muutoshakukelpoisuus}: MuutoshakukelpoisuusDropdownProps) => {
  const createMuutoshakukelpoisuusDropdownItem = (field: Field) => {
    return (
      <div className="muutoshakukelpoisuus-dropdown-item">
        <div className="muutoshakukelpoisuus-dropdown-item-brown-box">
          <b>Id</b> <span>{field.id}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="muutoshakukelpoisuus-dropdown">
      {JSON.parse(JSON.stringify(muutoshakukelpoisuus["erroneous-fields"]))
        .map(createMuutoshakukelpoisuusDropdownItem)}
    </div>
  )
}

interface MuutoshakukelpoisuusContainerProps {
  muutoshakukelpoisuus: Muutoshakukelpoisuus
}

let initialState = {
  open: false
}

export const MuutoshakukelpoisuusContainer = ( {muutoshakukelpoisuus}: MuutoshakukelpoisuusContainerProps) => {
  const [state, setState] = useState(initialState)

  const controlDropdown = () => {
    setState({ open: !state.open})
  }

  return (
    <div className="muutoshakukelpoisuus-container">
      <MuutoshakukelpoisuusWarning muutoshakukelpoisuus={muutoshakukelpoisuus} controlDropdown={controlDropdown} />
      { state.open && 
        <MuutoshakukelpoisuusDropdown muutoshakukelpoisuus={muutoshakukelpoisuus} />
      }
    </div>
  )
}

