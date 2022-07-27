import React from "react";
import { VaCodeValue } from "../types";
import AutoCompleteCodeValue from "./AutoCompleteCodeValue";
import HakujenHallintaController, {
  SelectedAvustushaku,
  State,
} from "../HakujenHallintaController";
import { EnvironmentApiResponse } from "soresu-form/web/va/types/environment";

import "../style/projektien-valinta.less";

interface ProjectSelectorsProps {
  state: State;
  avustushaku: SelectedAvustushaku;
  controller: HakujenHallintaController;
  codeOptions: VaCodeValue[];
  disabled: boolean;
  environment: EnvironmentApiResponse;
}

export default function ProjectSelectors(props: ProjectSelectorsProps) {
  const { state, avustushaku, environment, controller } = props;
  let { codeOptions, disabled } = props;

  disabled = disabled || state.loadingProjects;

  codeOptions = makeNoProjectCodeFirstElement(codeOptions);

  const updateValue =
    (project: VaCodeValue | null) => (option: VaCodeValue | null) => {
      if (option === null) {
        return;
      }
      const projects = avustushaku.projects || [];

      // poista ylikirjoitettu projekti
      const oldProjectInd = projects.findIndex((proj) => proj === project);
      if (oldProjectInd !== -1) {
        projects.splice(oldProjectInd, 1);
      }

      controller.saveProjects(avustushaku, [option, ...projects]);
    };

  const addRow = () => {
    const projects = avustushaku.projects || [];
    projects.push(codeOptions[0]);
    controller.saveProjects(avustushaku, projects);
  };

  const removeRow = (project: VaCodeValue | null) => () => {
    const projects = avustushaku.projects || [];
    const oldProjectInd = projects.findIndex((proj) => proj === project);
    if (oldProjectInd !== -1) {
      projects.splice(oldProjectInd, 1);
    }
    controller.saveProjects(avustushaku, projects);
  };

  return (
    <div className="projekti-valitsimet">
      {!avustushaku.projects || avustushaku.projects.length < 1 ? (
        <ProjectSelector
          codeOptions={codeOptions.filter((k) => k["value-type"] === "project")}
          selectedValue={""}
          disabled={disabled}
          environment={environment}
          updateValue={updateValue(null)}
          removeRow={removeRow(null)}
          addRow={addRow}
        />
      ) : (
        avustushaku.projects?.map((project: VaCodeValue, ind) => {
          return (
            <ProjectSelector
              key={`${project.id}-${ind}`}
              codeOptions={codeOptions.filter(
                (k) => k["value-type"] === "project"
              )}
              selectedValue={project}
              disabled={disabled}
              environment={environment}
              updateValue={updateValue(project)}
              removeRow={removeRow(project)}
              addRow={addRow}
            />
          );
        })
      )}
    </div>
  );
}

export interface ProjectSelectorProps {
  updateValue: (option: VaCodeValue | null) => void;
  codeOptions: VaCodeValue[];
  selectedValue: VaCodeValue | "";
  disabled: boolean;
  environment: EnvironmentApiResponse;
  addRow: () => void;
  removeRow?: () => void;
}

function ProjectSelector({
  codeOptions,
  disabled,
  environment,
  selectedValue,
  updateValue,
  addRow,
  removeRow,
}: ProjectSelectorProps) {
  return (
    <div data-test-id={`projekti-valitsin-${selectedValue ? selectedValue.code : "initial"}`} className="projekti-valitsin">
      <AutoCompleteCodeValue
        codeType="project-id"
        codeOptions={codeOptions.filter((k) => k["value-type"] === "project")}
        selectedValue={selectedValue}
        disabled={disabled}
        environment={environment}
        updateValue={updateValue}
      />
      <button disabled={disabled} data-test-id={`lisaa-projekti-${selectedValue ? selectedValue.code : "initial"}`} className="lisaa-projekti projekti-nappula" onClick={addRow}>
        <AddProjectButtonIcon />
      </button>
      <button disabled={disabled} className="poista-projekti projekti-nappula" onClick={removeRow}>
        <RemoveProjectButtonIcon />
      </button>
    </div>
  );
}

function makeNoProjectCodeFirstElement(codeOptions: VaCodeValue[]) {
  const noProjectCodeInd = codeOptions.findIndex(
    (code: VaCodeValue) => code["code-value"] === "Ei projektikoodia"
  );
  const noProjectCode = codeOptions[noProjectCodeInd];
  codeOptions.splice(noProjectCodeInd, 1);
  return [noProjectCode, ...codeOptions];
}

const AddProjectButtonIcon = () => (
  <svg
    width="20"
    height="21"
    viewBox="0 0 20 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 0.5C4.45312 0.5 0 4.99219 0 10.5C0 16.0469 4.45312 20.5 10 20.5C15.5078 20.5 20 16.0469 20 10.5C20 4.99219 15.5078 0.5 10 0.5ZM13.75 11.4375H10.9375V14.25C10.9375 14.7969 10.5078 15.1875 10 15.1875C9.45312 15.1875 9.0625 14.7969 9.0625 14.25V11.4375H6.25C5.70312 11.4375 5.3125 11.0469 5.3125 10.5C5.3125 9.99219 5.70312 9.5625 6.25 9.5625H9.0625V6.75C9.0625 6.24219 9.45312 5.8125 10 5.8125C10.5078 5.8125 10.9375 6.24219 10.9375 6.75V9.5625H13.75C14.2578 9.5625 14.6875 9.99219 14.6875 10.5C14.6875 11.0469 14.2578 11.4375 13.75 11.4375Z"
      fill="#499CC7"
    />
  </svg>
);

const RemoveProjectButtonIcon = () => (
  <svg
    width="20"
    height="21"
    viewBox="0 0 20 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 0.5C4.45312 0.5 0 4.99219 0 10.5C0 16.0469 4.45312 20.5 10 20.5C15.5078 20.5 20 16.0469 20 10.5C20 4.99219 15.5078 0.5 10 0.5ZM13.75 11.4375H6.25C5.70312 11.4375 5.3125 11.0469 5.3125 10.5C5.3125 9.99219 5.70312 9.5625 6.25 9.5625H13.75C14.2578 9.5625 14.6875 9.99219 14.6875 10.5C14.6875 11.0469 14.2578 11.4375 13.75 11.4375Z"
      fill="#BA3E35"
    />
  </svg>
);
