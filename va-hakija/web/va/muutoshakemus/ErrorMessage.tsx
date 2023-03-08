import React from 'react'

export interface ErrorMessageProps {
  text?: string
}

export const ErrorMessage = ({ text }: ErrorMessageProps) => {
  return <span className="muutoshakemus__error-message">{text || ' '}</span>
}
