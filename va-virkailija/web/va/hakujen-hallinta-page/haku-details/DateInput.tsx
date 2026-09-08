import React, { createContext, forwardRef, useContext, useEffect, useState } from 'react'
import DatePicker from 'react-widgets/DatePicker'
import { DateTimePicker } from './DateTimePicker'
import moment, { Moment } from 'moment'
import {
  dateformats,
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
  error?: string
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
    error,
    onValidityChange,
  } = props
  const Picker = includeTime ? DateTimePicker : DatePicker
  const format = includeTime ? fiDateTimeFormat : fiLongFormat
  const savedText = defaultValue ? moment(defaultValue).format(format) : ''
  const [text, setText] = useState(savedText)
  const [showError, setShowError] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const parse = includeTime ? parseDateTimeString : parseDateString
  const parsed = parse(text, undefined)
  const isValid = !!parsed || (allowEmpty && text === '')
  const formatError = showError && !isValid
  const hasError = !isEditing && (formatError || !!error)

  function isNonexistentDate() {
    const dateFlags = moment(
      includeTime ? text.split(' ')[0] : text,
      dateformats,
      true
    ).parsingFlags()
    return (
      dateFlags.overflow >= 0 &&
      dateFlags.unusedTokens.length === 0 &&
      dateFlags.charsLeftOver === 0
    )
  }

  useEffect(() => {
    setText(savedText)
    setShowError(false)
    setIsEditing(false)
  }, [savedText])

  useEffect(() => {
    onValidityChange?.(isValid)
  }, [isValid, onValidityChange])

  const acceptDate = (newDate: Date | null | undefined) => {
    setText(newDate ? moment(newDate).format(format) : '')
    setShowError(false)
    setIsEditing(false)
  }

  function onChangeHandlerFor(id: string) {
    return function onChangeHandler(newDate: Date | null | undefined) {
      acceptDate(newDate)
      onChange(id, moment(newDate ?? null))
    }
  }

  function getClassNames(): string {
    return hasError ? `datepicker ${styles.invalid}` : 'datepicker'
  }

  function getError(): { errorMessage?: string; errorHint?: string } {
    if (!formatError) return { errorMessage: error }

    if (isNonexistentDate()) {
      return {
        errorMessage: 'Tätä päivämäärää ei ole olemassa.',
        errorHint: 'Tarkista päivä, kuukausi ja vuosi.',
      }
    }

    if (includeTime) {
      return {
        errorMessage: 'Virheellinen päivämäärä.',
        errorHint: 'Anna päivä ja kellonaika, esim. 1.2.2027 9.00.',
      }
    }

    return {
      errorMessage: 'Virheellinen päivämäärä.',
      errorHint: 'Anna päivä muodossa pp.kk.vvvv.',
    }
  }

  const { errorMessage, errorHint } = getError()

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
            onChange: (event) => {
              setText(event.target.value)
              setIsEditing(true)
            },
            onBlur: () => {
              setIsEditing(false)
              setShowError(!isValid)
              if (!isValid) return
              const newDate = parsed ? moment(parsed) : moment.invalid()
              const newText = parsed ? newDate.format(format) : ''
              if (newText !== savedText) {
                onChange(id, newDate)
              }
              setText(newText)
            },
          }}
        >
          <Picker
            id={id}
            name={id}
            parse={parse}
            onChange={onChangeHandlerFor(id)}
            onSelect={acceptDate}
            calendarProps={{ formats: { header: 'MMMM YYYY' } }}
            value={defaultValue}
            placeholder={placeholder}
            containerClassName={getClassNames()}
            disabled={disabled}
            inputProps={{ component: DateTextInput, 'aria-invalid': hasError }}
            aria-describedby={hasError ? `${id}-error` : undefined}
          />
        </TextInputContext.Provider>
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      {hasError && (
        <div id={`${id}-error`} className={styles.error} role="alert">
          {errorMessage}
          {errorHint && <span className={styles.hint}>{errorHint}</span>}
        </div>
      )}
    </div>
  )
}
