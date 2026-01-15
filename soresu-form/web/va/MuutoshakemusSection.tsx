import React from 'react'
import ClassNames from 'classnames'

import './MuutoshakemusSection.css'

interface Props {
  blueMiddleComponent?: React.JSX.Element
  bottomComponent?: React.JSX.Element
  datepickerFix?: boolean
  children: React.ReactNode
}

export const MuutoshakemusSection: React.FC<Props> = ({
  blueMiddleComponent,
  bottomComponent,
  datepickerFix,
  children,
}) => (
  <section
    className={ClassNames('muutoshakemus-form-section', {
      'muutoshakemus-form-section_date-picker-fix': datepickerFix,
    })}
  >
    <div className="muutoshakemus-form-section_content">{children}</div>
    {blueMiddleComponent && (
      <div className="muutoshakemus-form-section_cta">{blueMiddleComponent}</div>
    )}
    {bottomComponent && <div className="muutoshakemus-form-section_content">{bottomComponent}</div>}
  </section>
)
