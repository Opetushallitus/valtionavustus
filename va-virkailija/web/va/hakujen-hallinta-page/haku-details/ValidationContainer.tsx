import React, { useState } from 'react'

import 'react-widgets/styles.css'

import { ValidationResult } from '../../types'
import useScrollingUp from '../../useScrollingUp'
import classNames from 'classnames'

import * as styles from './ValidationContainer.module.css'

const fieldLabels: Record<string, string> = {
  'applicant-name': 'Yhteyshenkilön nimi',
  'primary-email': 'Yhteyshenkilön sähköposti',
  'textField-0': 'Yhteyshenkilön puhelinnumero',
}

interface WarningProps {
  result: ValidationResult
  controlDropdown: () => void
  errorTexts?: {
    single: string
    multiple: (numberOfErrors: number) => string
  }
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

const Warning = ({ result, controlDropdown, errorTexts }: WarningProps) => {
  const numberOfErrors = result['erroneous-fields'].length
  const warningText =
    numberOfErrors > 1
      ? errorTexts?.multiple(numberOfErrors) ||
        `Lomakkeesta puuttuu ${numberOfErrors} muutoshakemukselle tarpeellista kenttää. Muutoshaku ei ole mahdollista.`
      : errorTexts?.single ||
        `Lomakkeesta puuttuu muutoshakemukselle tarpeellinen kenttä. Muutoshaku ei ole mahdollista.`
  return (
    <div className={`${styles.validationInfo} ${styles.validationWarningShadow}`}>
      <span data-test-id="validation-warning">
        <span className={styles.validationIconOk}>
          <IconExclamationMark />
        </span>
        <span className={styles.validationTextBold}>{warningText}</span>
      </span>
      <div
        className={styles.validationWarningButton}
        data-test-id="validation-warning-button"
        onClick={controlDropdown}
      >
        <span className={styles.validationWarningButtonText}>Näytä lisätietoja</span>
        <span className={styles.validationWarningArrow}>
          <IconArrowDown />
        </span>
      </div>
    </div>
  )
}

export const Ok = ({
  avustushakuMuutoshakukelpoinen,
}: {
  avustushakuMuutoshakukelpoinen: boolean
}) => {
  return (
    <div className={`${styles.validationInfo} ${styles.validationOkShadow}`}>
      <span data-test-id="validation-ok">
        <span className={styles.validationIconOk}>
          <IconOkMark />
        </span>
        <span className={styles.validationTextBold}>Lomake on muutoshakukelpoinen</span>
        {avustushakuMuutoshakukelpoinen ? (
          <span className={styles.validationText}>
            Muutoshakulomake toimitetaan avustuksen saajille automaattisesti päätösviestin
            yhteydessä
          </span>
        ) : (
          <span className={styles.validationText}>
            Muutoshakulomakkeen sijaan yhteystietojenmuokkauslomake toimitetaan avustuksen saajille
            automaattisesti päätösviestin yhteydessä, sillä avustushaku on merkitty
            muuoshakukelvottomaksi haun tiedot -välilehdellä
          </span>
        )}
      </span>
    </div>
  )
}

const Dropdown = ({ result }: ValidationProps) => {
  return (
    <div className={styles.validationDropdown}>
      {result['erroneous-fields'].map((field) => (
        <div key={field.id} className={styles.validationDropdownItem}>
          <div className={styles.validationDropdownItemBrownBox}>
            <b>Id</b> <span data-test-id="validation-dropdown-item-id">{field.id}</span>
          </div>
          <div className={styles.validationDropdownItemBrownBox}>
            <b>Selite</b>{' '}
            <span data-test-id="validation-dropdown-item-label">
              {field?.label || fieldLabels[field.id]}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

interface ValidationProps {
  result: ValidationResult
  errorTexts?: {
    single: string
    multiple: (numberOfErrors: number) => string
  }
  avustushakuMuutoshakukelpoinen: boolean
  extraClasses?: string
}

let initialState = {
  open: false,
}

export const ScrollAwareValidationContainer = (props: ValidationProps) => {
  const isScrollingUp = useScrollingUp()
  return (
    <ValidationContainer
      {...props}
      extraClasses={classNames(
        props.extraClasses,
        isScrollingUp ? styles.validationContainerWithHeader : undefined
      )}
    />
  )
}

export const ValidationContainer = ({
  result,
  errorTexts,
  extraClasses = '',
  avustushakuMuutoshakukelpoinen,
}: ValidationProps) => {
  const [state, setState] = useState(initialState)
  const colorClass = result['is-ok'] ? styles.validationOk : styles.validationWarning

  const controlDropdown = () => {
    setState({ open: !state.open })
  }
  return (
    <div className={classNames(styles.validationContainer, colorClass, extraClasses)}>
      {result['is-ok'] ? (
        <Ok avustushakuMuutoshakukelpoinen={avustushakuMuutoshakukelpoinen} />
      ) : (
        <Warning result={result} controlDropdown={controlDropdown} errorTexts={errorTexts} />
      )}
      {state.open && (
        <Dropdown result={result} avustushakuMuutoshakukelpoinen={avustushakuMuutoshakukelpoinen} />
      )}
    </div>
  )
}
