import { ValueType, valueTypes } from "./types";
import React, { useDeferredValue, useEffect, useState } from "react";
import * as yup from "yup";
import {
  useAddVaCodeMutation,
  useGetVaCodeValuesQuery,
  useRemoveVaCodeMutation,
  useUpdateVaCodeVisibilityMutation,
} from "./apiSlice";
import { Field, FormikProvider, useFormik } from "formik";
import { IconButton } from "./IconButton";
import { IconLockClosed } from "./IconLockClosed";
import { IconLockOpen } from "./IconLockOpen";
import { IconDelete } from "./IconDelete";

const getInitialCodeInputState = (selectedTab: ValueType) => ({
  year: "",
  code: "",
  ["code-value"]: "",
  ["value-type"]: selectedTab,
});

const VaCodeValueSchema = yup.object().shape({
  year: yup
    .number()
    .min(1970, "Vuosi voi olla minimissään 1970")
    .max(2100, "Vuosi voi olla maksimissaan 2100")
    .required("Vuosi on pakollinen"),
  code: yup.string().required("Koodi on pakollinen"),
  "code-value": yup.string().required("Nimi on pakollinen"),
  "value-type": yup
    .string()
    .oneOf(valueTypes)
    .required("value-type on pakollinen"),
});

const CodeInputForm = ({ valueType }: { valueType: ValueType }) => {
  const [addCode] = useAddVaCodeMutation();
  const formik = useFormik({
    initialValues: getInitialCodeInputState(valueType),
    validationSchema: VaCodeValueSchema,
    onSubmit: async (values, formikHelpers) => {
      try {
        await addCode({
          ...values,
          year: Number(values.year),
        }).unwrap();
        formikHelpers.resetForm({
          values: getInitialCodeInputState(valueType),
        });
      } catch (e) {
      } finally {
        formikHelpers.setSubmitting(false);
      }
    },
  });
  const {
    touched,
    errors,
    resetForm,
    isSubmitting,
    handleSubmit,
    isValid,
    dirty,
  } = formik;
  useEffect(() => {
    resetForm({
      values: getInitialCodeInputState(valueType),
    });
  }, [valueType]);
  const submitDisabled = isSubmitting || !(isValid && dirty);
  return (
    <FormikProvider value={formik}>
      <form onSubmit={handleSubmit}>
        <div className="code-input-container">
          <div className="code-input code-input__year">
            <label className="oph-label" htmlFor="year">
              Vuosi
            </label>
            <Field
              id="year"
              name="year"
              data-test-id="code-form__year"
              className="oph-input"
            />
          </div>
          <div className="code-input code-input__code">
            <label className="oph-label" htmlFor="code">
              Koodi
            </label>
            <Field
              id="code"
              name="code"
              data-test-id="code-form__code"
              className="oph-input"
            />
          </div>
          <div className="code-input code-input__name">
            <label className="oph-label" htmlFor="code-value">
              Nimi
            </label>
            <Field
              id="code-value"
              name="code-value"
              data-test-id="code-form__name"
              className="oph-input"
            />
          </div>
          <button
            disabled={submitDisabled}
            type="submit"
            className="oph-button oph-button-disabled oph-button-primary code-input-submit"
            data-test-id="code-form__add-button"
          >
            Lisää
          </button>
          {isSubmitting && (
            <div className="code-input-saving">Tallennetaan...</div>
          )}
        </div>
        {touched.year && errors.year && (
          <div className="code-input-error">{errors.year}</div>
        )}
        {touched.code && errors.code && (
          <div className="code-input-error">{errors.code}</div>
        )}
        {touched["code-value"] && errors["code-value"] && (
          <div className="code-input-error">{errors["code-value"]}</div>
        )}
        {touched["value-type"] && errors["value-type"] && (
          <div className="code-input-error">{errors["value-type"]}</div>
        )}
      </form>
    </FormikProvider>
  );
};

const SkeletonCodes = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handle = setTimeout(() => setShow(true), 300);
    return () => {
      clearTimeout(handle);
    };
  }, []);
  return (
    <React.Fragment>
      {show &&
        Array(5)
          .fill(null)
          .map((_, index) => (
            <tr key={`skeleton-tr-${index}`} data-test-id="loading-codes">
              <td className="loading">
                <div />
              </td>
              <td className="loading">
                <div />
              </td>
              <td className="loading">
                <div />
              </td>
              <td className="loading">
                <div />
              </td>
              <td className="loading">
                <div />
              </td>
            </tr>
          ))}
    </React.Fragment>
  );
};

const Codes = ({ valueType }: { valueType: ValueType }) => {
  const [filterWord, setFilterWord] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const deferredFilterWord = useDeferredValue(filterWord);
  const {
    data: codes,
    isLoading,
    isSuccess,
  } = useGetVaCodeValuesQuery({ valueType, year: filterYear });
  const [removeCode] = useRemoveVaCodeMutation();
  const [updateVisibility] = useUpdateVaCodeVisibilityMutation();
  useEffect(() => {
    setFilterYear("");
    setFilterWord("");
  }, [valueType]);
  const deleteCode = (codeId: number) => async () => {
    if (window.confirm("Oletko aivan varma, että haluat poistaa koodin?")) {
      try {
        await removeCode(codeId).unwrap();
      } catch (e: any) {
        if ("status" in e && e.status === 405) {
          window.alert("Koodi on käytössä eikä sitä voi poistaa!");
        } else {
          console.log("unknown error");
        }
      }
    }
  };
  const setCodeVisibility = (codeId: number, hidden: boolean) => async () => {
    await updateVisibility({ id: codeId, hidden }).unwrap();
  };
  const filteredCodes =
    (deferredFilterWord === ""
      ? codes
      : codes?.filter((c) => c["code-value"].includes(deferredFilterWord))) ??
    [];
  return (
    <>
      <div className="code-input-container">
        <div className="code-input oph-select-container">
          <select
            className="oph-input oph-select"
            value={filterYear}
            onChange={(event) => {
              setFilterYear(event.target.value);
            }}
          >
            {Array(21)
              .fill(2017)
              .map((year, index) => {
                const value = index === 0 ? "" : year + index;
                return (
                  <option key={`year-filter-${value}`} value={value}>
                    {value}
                  </option>
                );
              })}
          </select>
        </div>
        <div className="code-input">
          <input
            className="oph-input"
            value={filterWord}
            onChange={(e) => setFilterWord(e.target.value)}
          />
        </div>
      </div>
      <table aria-busy={isLoading ? "true" : "false"} aria-live="polite">
        <colgroup>
          <col style={{ width: "10%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "50%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "8%" }} />
        </colgroup>
        <thead>
          <tr>
            <th className="code-cell">Vuosi</th>
            <th>Koodi</th>
            <th>Nimi</th>
            <th className="code-cell__buttons">Lukitse</th>
            <th className="code-cell__buttons">Poista</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <SkeletonCodes />}
          {!isLoading &&
            isSuccess &&
            filteredCodes.map((code) => {
              const fadeClass = code.hidden ? "code-cell__hidden" : "";
              return (
                <tr
                  key={`code-${code.id}`}
                  data-id={String(code.id)}
                  data-test-id={`code-cell-${code.year}-${code.code}-${code["code-value"]}`}
                >
                  <td className={fadeClass}>{code.year}</td>
                  <td className={fadeClass}>{code.code}</td>
                  <td className={fadeClass}>{code["code-value"]}</td>
                  <td className="code-cell__buttons">
                    <IconButton
                      data-test-id={code.hidden ? "show-code" : "hide-code"}
                      onClick={setCodeVisibility(code.id, !code.hidden)}
                    >
                      {code.hidden ? <IconLockClosed /> : <IconLockOpen />}
                    </IconButton>
                  </td>
                  <td className="code-cell__buttons">
                    <IconButton
                      data-test-id="delete-code"
                      className="icon-delete"
                      onClick={deleteCode(code.id)}
                    >
                      <IconDelete />
                    </IconButton>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </>
  );
};

export const VaCode = ({ valueType }: { valueType: ValueType }) => (
  <>
    <CodeInputForm valueType={valueType} />
    <hr />
    <Codes valueType={valueType} />
  </>
);
