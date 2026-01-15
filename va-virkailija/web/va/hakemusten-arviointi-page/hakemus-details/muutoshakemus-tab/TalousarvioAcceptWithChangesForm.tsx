import 'soresu-form/web/va/muutoshakemus/talous.css'

import React from 'react'

import { getNestedInputErrorClass } from 'soresu-form/web/va/formikHelpers'
import { Meno, Talousarvio, TalousarvioValues } from 'soresu-form/web/va/types/muutoshakemus'
import { MuutoshakemusPaatosFormValues } from './hakemusTypes'

interface TalousarvioAcceptWithChangesFormProps {
  f: MuutoshakemusPaatosFormValues
  talousarvio: Talousarvio
  requestedTalousarvio: Talousarvio
}

const calculateCurrentSum = (talousarvio: TalousarvioValues): number => {
  return Object.keys(talousarvio).reduce(
    (acc, cur) => (cur !== 'currentSum' && cur !== 'originalSum' ? acc + talousarvio[cur] : acc),
    0
  )
}

const getMenoValues = (f: MuutoshakemusPaatosFormValues, meno: Meno) => {
  return {
    inputClass: getNestedInputErrorClass(f, ['talousarvio', 'talousarvio', meno.type]),
    value: f.values.talousarvio?.talousarvio?.[meno.type],
  }
}

const MenoRow = ({
  f,
  meno,
  requestedTalousarvio,
}: {
  f: MuutoshakemusPaatosFormValues
  meno: Meno
  requestedTalousarvio: Talousarvio
}) => {
  const name = `talousarvio.${meno.type}`
  const { inputClass, value } = getMenoValues(f, meno)
  const amountClass = value === meno.amount ? '' : 'linethrough'
  const requestedAmount = requestedTalousarvio.find((m) => m.type === meno.type)?.amount

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = parseInt(e.target.value)
    const valueIsNaN = isNaN(value)
    f.setFieldValue(`talousarvio.${name}`, valueIsNaN ? '' : value)
    if (f.values.talousarvio?.talousarvio && !valueIsNaN) {
      f.setFieldValue(
        'talousarvio.talousarvio.currentSum',
        calculateCurrentSum({
          ...f.values.talousarvio.talousarvio,
          [meno.type]: value,
        })
      )
    }
  }

  return (
    <div className="muutoshakemus_talousarvio_row" data-test-id="meno-input-row">
      <div className="currentBudget">
        <span>{meno['translation-fi']}</span>
        <span className={amountClass}>{meno.amount} €</span>
      </div>
      <div className="separator" />
      <div className="requestedAmount" data-test-id="requested-amount">
        {requestedAmount} €
      </div>
      <div className="changedAmount" data-test-id="meno-input">
        <input
          name={name}
          className={inputClass}
          type="number"
          onChange={handleChange}
          onBlur={f.handleBlur}
          value={value}
          min={0}
        />
      </div>
      <div className="changedAmountEur">€</div>
    </div>
  )
}

export const TalousarvioAcceptWithChangesForm = ({
  f,
  talousarvio,
  requestedTalousarvio,
}: TalousarvioAcceptWithChangesFormProps) => {
  // @ts-ignore Formik provides incorrect error type
  const currentSumError = f.errors.talousarvio?.talousarvio?.currentSum
  const currentSumErrorClass = currentSumError ? 'currentSumError' : ''
  const currentSumErrorElem = currentSumError && (
    <span className="muutoshakemus__error">{currentSumError}</span>
  )
  const { originalSum, currentSum } = f.values.talousarvio?.talousarvio ?? {}
  return (
    <React.Fragment>
      <div className="muutoshakemus_talousarvio_row">
        <div className="currentBudget">
          <h3 className="muutoshakemus__header">Voimassaoleva talousarvio</h3>
        </div>
        <div className="separator noborder" />
        <div className="requestedHeader">
          <h3 className="muutoshakemus__header">Haetut muutokset</h3>
        </div>
        <div className="changedAmount">
          <h3 className="muutoshakemus__header">OPH:n hyväksymä</h3>
        </div>
        <div className="changedAmountEur" />
      </div>
      <div className="muutoshakemus_talousarvio">
        {talousarvio.map((meno) => (
          <MenoRow
            f={f}
            meno={meno}
            key={meno['type']}
            requestedTalousarvio={requestedTalousarvio}
          />
        ))}
      </div>
      <hr className="muutoshakemus_talousarvio_horizontalSeparatorWithRequestedAmount" />
      <div className="muutoshakemus_talousarvio_row">
        <div className="currentBudget">
          <b>Menot yhteensä</b>
          <b>{originalSum} €</b>
        </div>
        <div className="separator noborder" />
        <div className="requestedAmount" data-test-id="requested-sum">
          {originalSum} €
        </div>
        <div className="changedAmount" data-test-id="current-sum">
          <b className={currentSumErrorClass}>{currentSum}</b>
        </div>
        <div className="changedAmountEur">
          <b>€</b>
        </div>
      </div>
      <div className="muutoshakemus_talousarvio_row">
        <div className="currentBudget" />
        <div className="separator noborder" />
        <div className="requestedAmount" />
        <div className="changedAmount" data-test-id="current-sum-error">
          {currentSumErrorElem}
        </div>
        <div className="changedAmountEur" />
      </div>
    </React.Fragment>
  )
}
