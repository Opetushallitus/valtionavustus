import React, { PropsWithChildren } from "react";
import Select, {
  SingleValueProps,
  components,
  OptionProps,
  GroupBase,
} from "react-select";
import HakujenHallintaController, {
  Avustushaku,
} from "../HakujenHallintaController";
import { EnvironmentApiResponse } from "soresu-form/web/va/types/environment";
import { VaCodeValue } from "../types";

type CodeType = "operational-unit-id" | "project-id" | "operation-id";

interface AutoCompleteCodeValueProps {
  id: CodeType;
  codeType: CodeType;
  controller: HakujenHallintaController;
  avustushaku: Avustushaku;
  codeOptions: VaCodeValue[];
  selectedValue: VaCodeValue | "";
  disabled: boolean;
  environment: EnvironmentApiResponse;
}

const colorDarkGray = "rgb(153, 146, 144)";

export default function AutocompleteCodeValue(
  props: AutoCompleteCodeValueProps
) {
  const {
    controller,
    avustushaku,
    id,
    codeType,
    selectedValue,
    disabled,
    environment,
  } = props;
  let { codeOptions } = props;
  const updateValue = (option: VaCodeValue | null) => {
    if (option == null) {
      controller.onChangeListener(avustushaku, { id }, null);
      avustushaku[codeType] = null;
    } else {
      controller.onChangeListener(avustushaku, { id }, option.id);
      avustushaku[codeType] = option.id;
    }
  };

  const multipleProjectCodesEnabled =
    environment["multiple-project-codes"]?.["enabled?"];

  if (multipleProjectCodesEnabled && codeType === "project-id") {
    makeNoProjectCodeFirstElement(codeOptions);
  }

  const getOptionValue = (option: VaCodeValue) =>
    `${option.code} ${option["code-value"]}`;

  return (
    <Select
      classNamePrefix={`code-value-dropdown-${codeType}`}
      getOptionLabel={getOptionValue}
      placeholder={
        multipleProjectCodesEnabled && codeType === "project-id"
          ? 'Syötä projektikoodi tai valitse "Ei projektikoodia"'
          : "Valitse listasta"
      }
      options={codeOptions}
      onChange={updateValue}
      isMulti={false}
      styles={{
        singleValue: (base, { data }) => ({
          ...base,
          whiteSpace: "normal",
          color: data.hidden ? colorDarkGray : base.color,
        }),
        option: (base, { data }) => ({
          ...base,
          color: data.hidden ? colorDarkGray : base.color,
        }),
      }}
      noOptionsMessage={() => "Ei hakutuloksia"}
      getOptionValue={getOptionValue}
      isDisabled={disabled}
      value={selectedValue as VaCodeValue}
      backspaceRemovesValue={true}
      isOptionDisabled={(option) => Boolean(option.hidden)}
      components={{ Option, SingleValue }}
    />
  );
}

export function Option({
  children,
  ...props
}: PropsWithChildren<OptionProps<VaCodeValue, false, GroupBase<VaCodeValue>>>) {
  const { data, innerProps } = props;
  // add data-test-id to component
  const propsWithDataTestId = Object.assign({}, innerProps, {
    "data-test-id": data.code,
  });
  return (
    <components.Option {...props} innerProps={propsWithDataTestId}>
      {children}
    </components.Option>
  );
}

function SingleValue({
  children,
  ...props
}: PropsWithChildren<
  SingleValueProps<VaCodeValue, false, GroupBase<VaCodeValue>>
>) {
  const { data, innerProps } = props;
  // add data-test-id to component
  const propsWithDataTestId = Object.assign({}, innerProps, {
    "data-test-id": `singlevalue-${data["value-type"]}`,
  });
  return (
    <components.SingleValue {...props} innerProps={propsWithDataTestId}>
      {children}
    </components.SingleValue>
  );
}

function makeNoProjectCodeFirstElement(codeOptions: VaCodeValue[]) {
  const noProjectCodeInd = codeOptions.findIndex(
    (code: VaCodeValue) => code["code-value"] === "Ei projektikoodia"
  );
  const noProjectCode = codeOptions[noProjectCodeInd];
  codeOptions.splice(noProjectCodeInd, 1);
  codeOptions = [noProjectCode, ...codeOptions];
}
