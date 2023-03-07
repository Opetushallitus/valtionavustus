import React from "react";
import { Field, Form as FormType } from "./formTypes";
import { TextField } from "soresu-form/form/components/TextField";
import {
  H1InfoElement,
  H3InfoElement,
} from "soresu-form/form/components/InfoElement";

export const Form = ({ form }: { form: FormType }) => {
  return (
    <React.Fragment>
      {form.content.map((field) => (
        <RenderField key={field.id} field={field} />
      ))}
    </React.Fragment>
  );
};

const RenderField = ({ field }: { field: Field }) => {
  if (field.fieldClass === "wrapperElement") {
    return (
      <div>
        <div>{field.id}</div>
        <div>
          {field.children?.map((field) => (
            <RenderField key={field.id} field={field} />
          ))}
        </div>
      </div>
    );
  }
  if (field.fieldClass === "formField") {
    if (field.fieldType === "textField") {
      return <TextField {...field} />;
    }
  }
  if (field.fieldClass === "infoElement") {
    if (field.fieldType === "h1") {
      return <H1InfoElement {...field} />;
    }
    if (field.fieldType === "h3") {
      return <H3InfoElement {...field} />;
    }
    if (field.fieldType === "link") {
      return;
    }
  }
  return <div>{field.id}</div>;
};
