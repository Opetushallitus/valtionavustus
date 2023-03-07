import React from "react";
import { InfoElement as InfoElementType } from "soresu-form/form/formTypes";

export const H1InfoElement = ({ text }: InfoElementType) => {
  return <h1>{text?.fi}</h1>;
};

export const H3InfoElement = ({ text }: InfoElementType) => {
  return <h3>{text?.fi}</h3>;
};

export const LinkInfoElement = ({}: InfoElementType) => {
  return <a target="_blank" rel="noopener noreferrer" />;
};
