import React from "react";
import * as yup from "yup";

import styles from "./TalousarviotilienHallinta.module.less";

import { Field, FormikProvider, useFormik } from "formik";
import {
  useCreateTalousarviotiliMutation,
  useGetTalousarvioTilitQuery,
  useRemoveTalousarviotiliMutation,
} from "./apiSlice";
import { Talousarviotili } from "./types";

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
      {error && (
        <div className={styles.error} data-test-id={`error-${name}`}>
          {error}
        </div>
      )}
    </div>
  );
};

const NewTiliRow = () => {
  const [createTalousarviotili] = useCreateTalousarviotiliMutation();
  const formik = useFormik({
    initialValues: {
      year: "",
      code: "",
      name: "",
      amount: "",
    },
    validationSchema: NewTiliSchema,
    onSubmit: async (values, formikHelpers) => {
      const { year, code, name, amount } = values;
      try {
        await createTalousarviotili({
          code,
          name,
          year: Number(year),
          amount: Number(amount),
        });
        formikHelpers.resetForm();
      } catch (e) {
      } finally {
        formikHelpers.setSubmitting(false);
      }
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

const TiliRow = ({ id, year, code, name, amount }: Talousarviotili) => {
  const [removeTili, { isLoading }] = useRemoveTalousarviotiliMutation();
  const deleteTili = async () => {
    if (
      window.confirm(
        `Oletko aivan varma, että haluat poistaa tilin ${code} ${name}?`
      )
    ) {
      try {
        await removeTili(id);
      } catch (e) {
        console.log(e);
      }
    }
  };
  return (
    <div className={styles.tiliRow} data-test-id={name}>
      <input className={styles.input} value={year} disabled />
      <input className={styles.input} id="code" value={code} disabled />
      <input className={styles.input} id="name" value={name} disabled />
      <input className={styles.inputEuro} id="amount" value={amount} disabled />
      <div className={styles.buttonContainer}>
        <button disabled={isLoading} className={styles.plusButton} />
        <button
          disabled={isLoading}
          className={styles.minusButton}
          onClick={deleteTili}
        />
      </div>
    </div>
  );
};

export const TalousarviotilienHallinta = () => {
  const { data } = useGetTalousarvioTilitQuery();
  return (
    <div className={styles.grid}>
      <div className={styles.row}>
        <Label text="Vuosiluku" labelFor="year"></Label>
        <Label text="TA-tilin koodi" labelFor="code"></Label>
        <Label text="TA-tilin nimi" labelFor="name"></Label>
        <Label text="TA-tilin euromäärä" labelFor="amount"></Label>
      </div>
      {data?.map((tili) => (
        <TiliRow key={tili.id} {...tili} />
      ))}
      <NewTiliRow />
    </div>
  );
};
