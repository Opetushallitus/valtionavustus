import React, { ReactNode } from 'react'

import { FormikHook, FormValues } from 'soresu-form/web/va/types/muutoshakemus'

type AvustuksenKayttoajanPidennysProps = {
  f: FormikHook
  name: keyof FormValues
  title: string
  children: ReactNode
}

export const MuutoshakemusFormSection = ({
  f,
  name,
  title,
  children,
}: AvustuksenKayttoajanPidennysProps) => {
  return (
    <>
      <div className="muutoshakemus__section-checkbox-row">
        <input
          name={name}
          type="checkbox"
          id={`checkbox-${name}`}
          onChange={f.handleChange}
          onBlur={f.handleBlur}
          checked={!!f.values[name]}
        />
        <label htmlFor={`checkbox-${name}`}>{title}</label>
      </div>
      {f.values[name] && <div className="muutoshakemus__form-section-content">{children}</div>}
    </>
  )
}
