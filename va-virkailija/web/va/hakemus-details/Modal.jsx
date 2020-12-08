import React from 'react'
import FocusLock from 'react-focus-lock'

import './hakemusDetails.less'

export const Modal = ({ title, controller, children }) => {
  const closeModal = () => controller.setModal(undefined)
  return (
    <FocusLock returnFocus={true} lockProps={{style:{display:"contents"}}}>
      <div className="hakemus-details-modal__wrapper" onClick={closeModal} role="dialog">
        <div className="hakemus-details-modal__modal" onClick={(e) => e.stopPropagation()}>
          <div className="hakemus-details-modal__title-row">
            <span>{title}</span>
            <button className="hakemus-details-modal__close-button" onClick={closeModal}>Sulje</button>
          </div>
          <div className="hakemus-details-modal__content-wrapper">{children}</div>
        </div>
      </div>
    </FocusLock>
  )
}
