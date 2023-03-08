import React, { useState } from 'react'

import 'react-widgets/styles.css'

import './Muutoshakukelpoisuus.less'
import { OnkoMuutoshakukelpoinenAvustushakuOk } from '../types'
import useScrollingUp from '../useScrollingUp'

interface Field {
  id: 'project-name' | 'applicant-name' | 'primary-email' | 'textField-0'
}

const fieldLabels = {
  'project-name': 'Hankkeen nimi',
  'applicant-name': 'Yhteyshenkilön nimi',
  'primary-email': 'Yhteyshenkilön sähköposti',
  'textField-0': 'Yhteyshenkilön puhelinnumero',
}

interface MuutoshakukelpoisuusWarningProps {
  muutoshakukelpoisuus: OnkoMuutoshakukelpoinenAvustushakuOk
  controlDropdown: () => void
}

const IconExclamationMark = () => (
  <svg width="21" height="22" viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.5 2.26562C15.3398 2.26562 19.3594 6.24414 19.3594 11.125C19.3594 16.0469 15.3809 19.9844 10.5 19.9844C5.57812 19.9844 1.64062 16.0469 1.64062 11.125C1.64062 6.24414 5.57812 2.26562 10.5 2.26562ZM10.5 0.953125C4.88086 0.953125 0.328125 5.54688 0.328125 11.125C0.328125 16.7441 4.88086 21.2969 10.5 21.2969C16.0781 21.2969 20.6719 16.7441 20.6719 11.125C20.6719 5.54688 16.0781 0.953125 10.5 0.953125ZM10.0078 5.875C9.7207 5.875 9.51562 6.12109 9.51562 6.4082L9.80273 13.2988C9.80273 13.5449 10.0488 13.75 10.2949 13.75H10.6641C10.9102 13.75 11.1562 13.5449 11.1562 13.2988L11.4434 6.4082C11.4434 6.12109 11.2383 5.875 10.9512 5.875H10.0078ZM10.5 14.5703C9.84375 14.5703 9.35156 15.1035 9.35156 15.7188C9.35156 16.375 9.84375 16.8672 10.5 16.8672C11.1152 16.8672 11.6484 16.375 11.6484 15.7188C11.6484 15.1035 11.1152 14.5703 10.5 14.5703Z"
      fill="#956A14"
    />
  </svg>
)

const IconOkMark = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.5938 0.625L5.375 8.84375L2.375 5.8125C2.21875 5.6875 1.96875 5.6875 1.84375 5.8125L0.9375 6.71875C0.8125 6.84375 0.8125 7.09375 0.9375 7.25L5.125 11.4062C5.28125 11.5625 5.5 11.5625 5.65625 11.4062L15.0312 2.03125C15.1562 1.90625 15.1562 1.65625 15.0312 1.5L14.125 0.625C14 0.46875 13.75 0.46875 13.5938 0.625Z"
      fill="#108046"
    />
  </svg>
)

const IconArrowDown = () => (
  <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.9199 0.796875L12.3633 0.210937C12.2168 0.0644531 11.9824 0.0644531 11.8652 0.210937L6.5625 5.51367L1.23047 0.210938C1.11328 0.0644531 0.878906 0.0644531 0.732422 0.210938L0.175781 0.796875C0.0292969 0.914062 0.0292969 1.14844 0.175781 1.29492L6.29883 7.41797C6.44531 7.56445 6.65039 7.56445 6.79688 7.41797L12.9199 1.29492C13.0664 1.14844 13.0664 0.914062 12.9199 0.796875Z"
      fill="#956A14"
    />
  </svg>
)

export const MuutoshakukelpoisuusWarning = ({
  muutoshakukelpoisuus,
  controlDropdown,
}: MuutoshakukelpoisuusWarningProps) => {
  const numberOfErrors = muutoshakukelpoisuus['erroneous-fields'].length
  const warningText =
    numberOfErrors > 1
      ? `Lomakkeesta puuttuu ${numberOfErrors} muutoshakemukselle tarpeellista kenttää. Muutoshaku ei ole mahdollista.`
      : `Lomakkeesta puuttuu muutoshakemukselle tarpeellinen kenttä. Muutoshaku ei ole mahdollista.`
  return (
    <div className="muutoshakukelpoisuus-info muutoshakukelpoisuus-warning-shadow">
      <span data-test-id="muutoshakukelpoisuus-warning">
        <span className="muutoshakukelpoisuus-icon-warning">
          <IconExclamationMark />
        </span>
        <span className="muutoshakukelpoisuus-text-bold">{warningText}</span>
      </span>
      <div
        className="muutoshakukelpoisuus-warning-button"
        data-test-id="muutoshakukelpoisuus-warning-button"
        onClick={controlDropdown}
      >
        <span className="muutoshakukelpoisuus-warning-button-text">Näytä lisätietoja</span>
        <span className="muutoshakukelpoisuus-warning-arrow">
          <IconArrowDown />
        </span>
      </div>
    </div>
  )
}

export const MuutoshakukelpoisuusOk = () => {
  return (
    <div className="muutoshakukelpoisuus-info muutoshakukelpoisuus-ok-shadow">
      <span data-test-id="muutoshakukelpoisuus-ok">
        <span className="muutoshakukelpoisuus-icon-ok">
          <IconOkMark />
        </span>
        <span className="muutoshakukelpoisuus-text-bold">Lomake on muutoshakukelpoinen</span>
        <span className="muutoshakukelpoisuus-text">
          Muutoshakulomake toimitetaan avustuksen saajille automaattisesti päätösviestin yhteydessä
        </span>
      </span>
    </div>
  )
}

const MuutoshakukelpoisuusDropdown = ({ muutoshakukelpoisuus }: MuutoshakukelpoisuusProps) => {
  const createMuutoshakukelpoisuusDropdownItem = (field: Field) => {
    return (
      <div className="muutoshakukelpoisuus-dropdown-item">
        <div className="muutoshakukelpoisuus-dropdown-item-brown-box">
          <b>Id</b> <span className="muutoshakukelpoisuus-dropdown-item-id">{field.id}</span>
        </div>
        <div className="muutoshakukelpoisuus-dropdown-item-brown-box">
          <b>Selite</b>{' '}
          <span className="muutoshakukelpoisuus-dropdown-item-label">{fieldLabels[field.id]}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="muutoshakukelpoisuus-dropdown">
      {JSON.parse(JSON.stringify(muutoshakukelpoisuus['erroneous-fields'])).map(
        createMuutoshakukelpoisuusDropdownItem
      )}
    </div>
  )
}

interface MuutoshakukelpoisuusProps {
  muutoshakukelpoisuus: OnkoMuutoshakukelpoinenAvustushakuOk
}

let initialState = {
  open: false,
}

export const MuutoshakukelpoisuusContainer = ({
  muutoshakukelpoisuus,
}: MuutoshakukelpoisuusProps) => {
  const [state, setState] = useState(initialState)
  const isScrollingUp = useScrollingUp()
  const colorClass = muutoshakukelpoisuus['is-ok']
    ? 'muutoshakukelpoisuus-ok'
    : 'muutoshakukelpoisuus-warning'

  const controlDropdown = () => {
    setState({ open: !state.open })
  }

  return (
    <div
      className={`muutoshakukelpoisuus-container ${colorClass} ${
        isScrollingUp ? 'muutoshakukelpoisuus-container-with-header' : ''
      }`}
    >
      {muutoshakukelpoisuus['is-ok'] ? (
        <MuutoshakukelpoisuusOk />
      ) : (
        <MuutoshakukelpoisuusWarning
          muutoshakukelpoisuus={muutoshakukelpoisuus}
          controlDropdown={controlDropdown}
        />
      )}
      {state.open && <MuutoshakukelpoisuusDropdown muutoshakukelpoisuus={muutoshakukelpoisuus} />}
    </div>
  )
}
