import React from "react";
import * as yup from "yup";

import styles from "./TalousarviotilienHallinta.module.less";

import { Field, FormikProvider, useFormik } from "formik";

const Label = ({ text, labelFor }: { text: string; labelFor: string }) => {
  return (
    <div>
      <label htmlFor={labelFor}>{text}</label>
      <span className={styles.required}>*</span>
    </div>
  );
};

const NewTiliSchema = yup.object().shape({
  year: yup
    .number()
    .typeError("Vuosi pitää olla numero")
    .min(1970, "Vuosi voi olla minimissään 1970")
    .max(2100, "Vuosi voi olla maksimissaan 2100")
    .required("Vuosi on pakollinen"),
  code: yup.string().required("Koodi on pakollinen"),
  name: yup.string().required("Nimi on pakollinen"),
  amount: yup
    .number()
    .positive("Euromäärä ei voi olla negatiivinen")
    .typeError("Euromäärän pitää olla numero")
    .required("Euromäärä on pakollinen"),
});

interface FieldInputProps {
  name: string;
  placeholder: string;
  error?: string;
  className: string;
}

const FieldInput = ({
  name,
  placeholder,
  className,
  error,
}: FieldInputProps) => {
  return (
    <div className={styles.fieldContainer}>
      <Field
        className={`${className} ${error ? styles.inputError : ""}`}
        id={name}
        name={name}
        placeholder={placeholder}
      />
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

const NewTiliRow = () => {
  const formik = useFormik({
    initialValues: {
      year: "",
      code: "",
      name: "",
      amount: "",
    },
    validationSchema: NewTiliSchema,
    onSubmit: async (_values, formikHelpers) => {
      formikHelpers.setSubmitting(false);
    },
  });
  const submitDisabled = formik.isSubmitting || !formik.isValid;
  return (
    <FormikProvider value={formik}>
      <form onSubmit={formik.handleSubmit}>
        <div className={styles.tiliRow}>
          <FieldInput
            name="year"
            placeholder="Vuosiluku"
            className={styles.input}
            error={formik.touched.year ? formik.errors.year : undefined}
          />
          <FieldInput
            name="code"
            placeholder="Syötä TA-tilin koodi"
            className={styles.input}
            error={formik.touched.code ? formik.errors.code : undefined}
          />
          <FieldInput
            name="name"
            placeholder="Syötä tilin nimi"
            className={styles.input}
            error={formik.touched.name ? formik.errors.name : undefined}
          />
          <FieldInput
            name="amount"
            placeholder="Syötä euromäärä"
            className={styles.inputEuro}
            error={formik.touched.amount ? formik.errors.amount : undefined}
          />
          <div className={styles.buttonContainer}>
            <button
              className={styles.plusButton}
              type="submit"
              title="Tallenna uusi talousarviotili"
              disabled={submitDisabled}
            />
          </div>
        </div>
      </form>
    </FormikProvider>
  );
};

interface TiliProps {
  year: string;
  code: string;
  name: string;
  amount: string;
}

const TiliRow = ({ year, code, name, amount }: TiliProps) => {
  return (
    <div className={styles.tiliRow}>
      <input
        className={styles.input}
        placeholder="Vuosiluku"
        value={year}
        disabled
      />
      <input
        className={styles.input}
        id="code"
        placeholder="Syötä TA-tilin koodi"
        value={code}
        disabled
      />
      <input
        className={styles.input}
        id="name"
        placeholder="Syötä tilin nimi"
        value={name}
        disabled
      />
      <input
        className={styles.inputEuro}
        id="amount"
        placeholder="Syötä euromäärä"
        value={amount}
        disabled
      />
      <div className={styles.buttonContainer}>
        <button className={styles.plusButton} />
        <button className={styles.minusButton} />
      </div>
    </div>
  );
};

const tilit = [
  {
    id: 1,
    year: "2021",
    code: "0010100012",
    name: "testi koodi",
    amount: "10000",
  },
];

export const TalousarviotilienHallinta = () => {
  return (
    <div className={styles.grid}>
      <div className={styles.row}>
        <Label text="Vuosiluku" labelFor="year"></Label>
        <Label text="TA-tilin koodi" labelFor="code"></Label>
        <Label text="TA-tilin nimi" labelFor="name"></Label>
        <Label text="TA-tilin euromäärä" labelFor="amount"></Label>
      </div>
      {tilit.map(({ id, ...rest }) => (
        <TiliRow key={id} {...rest} />
      ))}
      <NewTiliRow />
    </div>
  );
};
