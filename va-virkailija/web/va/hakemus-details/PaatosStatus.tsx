import { translations } from 'soresu-form/web/va/i18n/translations'
import { MuutoshakemusPaatosFormValues } from './hakemusTypes'
import { TalousarvioValues } from 'soresu-form/web/va/types/muutoshakemus'
import React from 'react'

export const paatosStatuses = [
  {
    value: 'accepted',
    text: 'Hyväksytään',
    defaultReason: {
      fi: translations.fi.muutoshakemus.paatos.vakioperustelut.accepted,
      sv: translations.sv.muutoshakemus.paatos.vakioperustelut.accepted,
    },
  },
  {
    value: 'accepted_with_changes',
    text: 'Hyväksytään muutettuna',
    defaultReason: {
      fi: translations.fi.muutoshakemus.paatos.vakioperustelut.accepted_with_changes,
      sv: translations.sv.muutoshakemus.paatos.vakioperustelut.accepted_with_changes,
    },
  },
  {
    value: 'rejected',
    text: 'Hylätään',
    defaultReason: {
      fi: translations.fi.muutoshakemus.paatos.vakioperustelut.rejected,
      sv: translations.sv.muutoshakemus.paatos.vakioperustelut.rejected,
    },
  },
] as const

interface PaatosStatusRadioButtonProps {
  paatosStatus: typeof paatosStatuses[number]
  f: MuutoshakemusPaatosFormValues
  group: keyof Omit<MuutoshakemusPaatosFormValues['values'], 'reason'>
  talousarvioValues: TalousarvioValues | undefined
}

export const PaatosStatusRadioButton: React.FC<PaatosStatusRadioButtonProps> = ({
  paatosStatus: { value, text },
  f,
  talousarvioValues,
  group,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (talousarvioValues) {
      f.setFieldValue('talousarvio.talousarvio', talousarvioValues, true)
    }
    f.setFieldValue(`${group}.status`, e.target.value)
  }
  const key = `${group}-${value}`
  return (
    <React.Fragment key={`paatos-status-${key}`}>
      <input
        id={key}
        name={key}
        type="radio"
        value={value}
        onChange={handleChange}
        checked={f.values[group]?.status === value}
      />
      <label htmlFor={key}>{text}</label>
    </React.Fragment>
  )
}

interface GroupProps {
  group: keyof Omit<MuutoshakemusPaatosFormValues['values'], 'reason'>
  f: MuutoshakemusPaatosFormValues
  talousarvioValues?: TalousarvioValues
}

export const PaatosStatusRadioButtonGroup: React.FC<GroupProps> = ({
  talousarvioValues,
  f,
  group,
}) => {
  return (
    <fieldset className="soresu-radiobutton-group">
      {paatosStatuses.map((status) => (
        <PaatosStatusRadioButton
          key={`${group}-${status.value}`}
          f={f}
          paatosStatus={status}
          talousarvioValues={talousarvioValues}
          group={group}
        />
      ))}
    </fieldset>
  )
}
