import React from "react";

import './MuutoshakemusSection.less'

interface Props {
  blueMiddleComponent?: JSX.Element
  bottomComponent?: JSX.Element
}

export const MuutoshakemusSection: React.FC<Props> = ({blueMiddleComponent, bottomComponent, children}) => (
  <section className="muutoshakemus-form-section">
    <div className="muutoshakemus-form-section_content">
      {children}
    </div>
    {blueMiddleComponent && (
      <div className="muutoshakemus-form-section_cta">
        {blueMiddleComponent}
      </div>
    )}
    {bottomComponent && (
      <div className="muutoshakemus-form-section_content">
        {bottomComponent}
      </div>
    )}
  </section>
)
