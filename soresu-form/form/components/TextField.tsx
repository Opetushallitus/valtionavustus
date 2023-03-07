import React from "react";
import { FormField } from "soresu-form/form/formTypes";

export const TextField = ({ id, label }: FormField) => {
  return (
    <div>
      <label htmlFor={id}>{label?.fi}</label>
      <input type="text" id={id} value={""} />
    </div>
  );
};
