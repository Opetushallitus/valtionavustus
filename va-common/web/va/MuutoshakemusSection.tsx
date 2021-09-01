import React from "react";

import './MuutoshakemusSection.less'

interface Props {
  bottomComponent?: JSX.Element
}

export const MuutoshakemusSection: React.FC<Props> = ({bottomComponent, children}) => (
  <section className="muutoshakemus-form-section">
    <div className="muutoshakemus-form-section_content">
      {children}
    </div>
    {bottomComponent && (
      <div className="muutoshakemus-form-section_cta">
        {bottomComponent}
      </div>
    )}
  </section>
)
