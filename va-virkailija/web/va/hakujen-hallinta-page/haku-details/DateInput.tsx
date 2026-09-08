import React, { createContext, forwardRef, useContext, useEffect, useState } from 'react'
import DatePicker from 'react-widgets/DatePicker'
import moment, { Moment } from 'moment'
import {
  fiDateTimeFormat,
  fiLongFormat,
  parseDateString,
  parseDateTimeString,
} from 'soresu-form/web/va/i18n/dateformat'

import 'react-widgets/styles.css'
import * as styles from './DateInput.module.css'

type TextInputState = Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'onBlur'
>
const TextInputContext = createContext<TextInputState>({})

// Own the text value: DatePickerInput otherwise replaces rejected text with the saved date.
const DateTextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => {
    const textInput = useContext(TextInputContext)
    return <input {...props} {...textInput} ref={ref} />
  }
)
DateTextInput.displayName = 'DateTextInput'

interface DateInputProps {
  id: string
  defaultValue: Date | undefined
  onChange: (id: string, date: Moment) => void
  allowEmpty: boolean
  placeholder?: string
  disabled?: boolean
  includeTime?: boolean
  label?: string
  suffix?: React.ReactNode
  onValidityChange?: (valid: boolean) => void
}

export const DateInput = (props: DateInputProps) => {
  const {
    id,
    defaultValue,
    onChange,
    allowEmpty,
    placeholder,
    disabled,
    includeTime,
    label,
    suffix,
    onValidityChange,
  } = props
  const format = includeTime ? fiDateTimeFormat : fiLongFormat
  const savedText = defaultValue ? moment(defaultValue).format(format) : ''
  const [text, setText] = useState(savedText)
  const [showError, setShowError] = useState(false)
  const parse = includeTime ? parseDateTimeString : parseDateString
  const parsed = parse(text, undefined)
  const isValid = !!parsed || (allowEmpty && text === '')

  useEffect(() => {
    setText(savedText)
    setShowError(false)
  }, [savedText])

  useEffect(() => {
    onValidityChange?.(isValid)
  }, [isValid, onValidityChange])

  const acceptDate = (newDate: Date | null | undefined) => {
    setText(newDate ? moment(newDate).format(format) : '')
    setShowError(false)
  }

  function onChangeHandlerFor(id: string) {
    return function onChangeHandler(newDate: Date | null | undefined) {
      acceptDate(newDate)
      onChange(id, moment(newDate ?? null))
    }
  }

  function getClassNames(): string {
    return showError && !isValid ? `datepicker ${styles.invalid}` : 'datepicker'
  }

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={`${id}_input`}>
          {label}
        </label>
      )}
      <div className={styles.inputRow}>
        <TextInputContext.Provider
          value={{
            value: text,
            onChange: (event) => setText(event.target.value),
            onBlur: () => {
              setShowError(!isValid)
              if (!isValid) return
              const newDate = parsed ? moment(parsed) : moment.invalid()
              if ((parsed ? newDate.format(format) : '') !== savedText) onChange(id, newDate)
              setText(parsed ? newDate.format(format) : '')
            },
          }}
        >
          <DatePicker
            id={id}
            name={id}
            parse={parse}
            {...(includeTime ? { includeTime: true, valueFormat: fiDateTimeFormat } : {})}
            onChange={onChangeHandlerFor(id)}
            onSelect={acceptDate}
            calendarProps={{ formats: { header: 'MMMM YYYY' } }}
            value={defaultValue}
            placeholder={placeholder}
            containerClassName={getClassNames()}
            disabled={disabled}
            inputProps={{ component: DateTextInput, 'aria-invalid': showError && !isValid }}
            aria-describedby={showError && !isValid ? `${id}-error` : undefined}
          />
        </TextInputContext.Provider>
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      {showError && !isValid && (
        <div id={`${id}-error`} className={styles.error} role="alert">
          Virheellinen päivämäärä.
          <span className={styles.hint}>
            {includeTime
              ? 'Anna päivä ja kellonaika, esim. 1.2.2027 9.00.'
              : 'Anna päivä muodossa pp.kk.vvvv.'}
          </span>
        </div>
      )}
    </div>
  )
}
