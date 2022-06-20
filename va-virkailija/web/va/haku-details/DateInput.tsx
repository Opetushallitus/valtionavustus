import React, { useState } from "react";
import DatePicker from "react-widgets/DatePicker";
import moment, { Moment } from "moment";
import { parseDateString } from "soresu-form/web/va/i18n/dateformat";

import "react-widgets/styles.css";

interface DateInputProps {
  id: string;
  defaultValue: Date | undefined;
  onChange: (id: string, date: Moment) => void;
  allowEmpty: boolean;
  placeholder?: string
}

export const DateInput = (props: DateInputProps) => {
  const { id, defaultValue, onChange, allowEmpty, placeholder } = props;
  const [isValid, setIsValid] = useState(
    defaultValue !== undefined || allowEmpty
  );

  function onChangeHandlerFor(id: string) {
    return function onChangeHandler(newDate: Date | null | undefined) {
      console.log(newDate)
      const date = moment(newDate);
      console.log(date)
      setIsValid(
        date.isValid() ||
          ((newDate === null || newDate === undefined) && allowEmpty)
      );
      onChange(id, date);
    };
  }

  function getClassNames(): string {
    return isValid ? "datepicker" : "datepicker error";
  }

  return (
    <DatePicker
      name={id}
      parse={parseDateString}
      onChange={onChangeHandlerFor(id)}
      value={defaultValue}
      placeholder={placeholder}
      containerClassName={getClassNames()}
    />
  );
};
