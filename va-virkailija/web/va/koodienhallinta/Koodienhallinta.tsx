import React, { useEffect, useMemo, useState } from "react";
import * as yup from "yup";
import { ValueType, valueTypes } from "./types";

import { IconLockOpen } from "./IconLockOpen";
import { IconLockClosed } from "./IconLockClosed";
import { IconDelete } from "./IconDelete";
import { Field, FormikProvider, useFormik } from "formik";

import "./Koodienhallinta.less";
import {
  useAddVaCodeMutation,
  useGetVaCodeValuesQuery,
  useRemoveVaCodeMutation,
  useUpdateVaCodeVisibilityMutation,
} from "./apiSlice";
import { useAppDispatch, useAppSelector } from "./store";
import { selectedTabSelector, selectTab, updateFilter } from "./vaCodeSlice";

const tabName = {
  "operational-unit": "Toimintayksikkö",
  project: "Projekti",
  operation: "Toiminto",
} as const;

interface OphTabProps {
  valueType: ValueType;
}

const OphTab = ({ valueType }: OphTabProps) => {
  const selectedValueType = useAppSelector(selectedTabSelector);
  const dispatch = useAppDispatch();
  const classes =
    valueType === selectedValueType
      ? "oph-tab-item oph-tab-item-is-active"
      : "oph-tab-item";
  return (
    <a
      className={classes}
      data-test-id={`code-value-tab-${valueType}`}
      onClick={(e) => {
        e.preventDefault();
        dispatch(selectTab(valueType));
      }}
    >
      {tabName[valueType]}
    </a>
  );
};

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

const CodeInputForm = () => {
  const selectedTab = useAppSelector(selectedTabSelector);
  const [addCode] = useAddVaCodeMutation();
  const formik = useFormik({
    initialValues: getInitialCodeInputState(selectedTab),
    validationSchema: VaCodeValueSchema,
    onSubmit: async (values, formikHelpers) => {
      try {
        await addCode({
          ...values,
          year: Number(values.year),
        }).unwrap();
        formikHelpers.resetForm({
          values: getInitialCodeInputState(selectedTab),
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
      values: getInitialCodeInputState(selectedTab),
    });
  }, [selectedTab]);
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

const CodeFilter = () => {
  const dispatch = useAppDispatch();
  const selectedTab = useAppSelector(selectedTabSelector);
  const selectedYear = useAppSelector((state) => state.vaCode.filter.year);
  const [filterWord, setFilterWord] = useState("");
  useEffect(() => {
    setFilterWord("");
  }, [selectedTab]);
  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(updateFilter({ filter: "word", value: filterWord }));
    }, 275);
    return () => {
      clearTimeout(handle);
    };
  }, [filterWord]);
  return (
    <div className="code-input-container">
      <div className="code-input oph-select-container">
        <select
          className="oph-input oph-select"
          value={selectedYear}
          onChange={(event) => {
            dispatch(
              updateFilter({ filter: "year", value: event.target.value })
            );
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

const Codes = () => {
  const { year, word } = useAppSelector((state) => state.vaCode.filter);
  const selectedTab = useAppSelector(selectedTabSelector);
  const {
    data: codes,
    isLoading,
    isSuccess,
  } = useGetVaCodeValuesQuery({ valueType: selectedTab, year });
  const [removeCode] = useRemoveVaCodeMutation();
  const [updateVisibility] = useUpdateVaCodeVisibilityMutation();
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
  const filteredCodes = useMemo(() => {
    const filtered =
      word === ""
        ? codes
        : codes?.filter((c) => c["code-value"].includes(word));
    return filtered ?? [];
  }, [codes, word]);
  return (
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
                  <button
                    data-test-id={code.hidden ? "show-code" : "hide-code"}
                    className={`code-icon-button ${
                      code.hidden ? "code-icon-button__hidden" : ""
                    }`}
                    onClick={setCodeVisibility(code.id, !code.hidden)}
                  >
                    {code.hidden ? <IconLockClosed /> : <IconLockOpen />}
                  </button>
                </td>
                <td className="code-cell__buttons">
                  <button
                    data-test-id="delete-code"
                    className="code-icon-button icon-delete"
                    onClick={deleteCode(code.id)}
                  >
                    <IconDelete />
                  </button>
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
};

export const Koodienhallinta = () => {
  return (
    <div className="koodienhallinta-container">
      <div className="koodienhallinta-body">
        <div className="oph-tabs oph-typography">
          <OphTab valueType="operational-unit" />
          <OphTab valueType="project" />
          <OphTab valueType="operation" />
        </div>
        <CodeInputForm />
        <hr />
        <CodeFilter />
        <Codes />
      </div>
    </div>
  );
};
