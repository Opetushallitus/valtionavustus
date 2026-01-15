import React, { ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import FocusLock from 'react-focus-lock'

import './hakemusDetails.css'

export const MODAL_ROOT_ID = 'modal-root'

interface ModalProps {
  title: string
  children: ReactNode
  onClose: () => void
}

export const Modal = ({ title, children, onClose }: ModalProps) => {
  const el = useRef(document.createElement('div'))
  const modalRoot = document.getElementById(MODAL_ROOT_ID)!
  useEffect(() => {
    const escFunction = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', escFunction, false)
    return () => {
      document.removeEventListener('keydown', escFunction, false)
    }
  }, [onClose])
  useEffect(() => {
    modalRoot.appendChild(el.current)
    return () => {
      modalRoot.removeChild(el.current)
    }
  }, [])
  return createPortal(
    <FocusLock returnFocus lockProps={{ style: { display: 'contents' } }}>
      <div className="hakemus-details-modal__wrapper" onClick={onClose} role="dialog">
        <div className="hakemus-details-modal__modal" onClick={(e) => e.stopPropagation()}>
          <div className="hakemus-details-modal__title-row">
            <span>{title}</span>
            <button className="hakemus-details-modal__close-button" onClick={onClose}>
              Sulje
            </button>
          </div>
          <div className="hakemus-details-modal__content-wrapper">{children}</div>
        </div>
      </div>
    </FocusLock>,
    modalRoot
  )
}
