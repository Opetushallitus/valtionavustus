import React from 'react'
import DatePicker, { DatePickerProps } from 'react-widgets/DatePicker'
import { fiDateTimeFormat } from 'soresu-form/web/va/i18n/dateformat'

type DateTimePickerProps = Omit<DatePickerProps, 'includeTime' | 'valueFormat'>

export const DateTimePicker = (props: DateTimePickerProps) => (
  <DatePicker {...props} includeTime valueFormat={fiDateTimeFormat} />
)
