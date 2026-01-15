import React from 'react'
import moment from 'moment'
import { fiLongDateTimeFormatWithKlo } from 'soresu-form/web/va/i18n/dateformat'
import './VerificationBox.css'

interface VerificationBoxProps {
  title: string
  date: string | undefined
  verifier: string | undefined
}

const formatDate = (date?: string) => {
  const d = moment(date)
  return d?.format(fiLongDateTimeFormatWithKlo)
}

export const VerificationBox = ({ title, date, verifier }: VerificationBoxProps) => {
  if (!Boolean(title) || !Boolean(date) || !Boolean(verifier)) return <React.Fragment />

  return (
    <div className="verification-footer">
      <h3 className="verification-footer-header">{title}</h3>
      <span className="date" data-test-id="verified-at">
        {formatDate(date)}
      </span>
      <span data-test-id="verifier">{verifier}</span>
    </div>
  )
}
