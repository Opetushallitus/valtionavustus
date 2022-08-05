import React from "react";
import { VaCodeValue } from "../types";
import HakujenHallintaController, {
  SelectedAvustushaku,
  State,
} from "../HakujenHallintaController";
import ProjectSelector from "./ProjectSelector";

import "../style/projektien-valinta.less";

interface ProjectSelectorsProps {
  state: State;
  avustushaku: SelectedAvustushaku;
  controller: HakujenHallintaController;
  codeOptions: VaCodeValue[];
  disabled: boolean;
  multipleProjectCodesEnabled: boolean;
}

export default function ProjectSelectors(props: ProjectSelectorsProps) {
  const { state, avustushaku, multipleProjectCodesEnabled, controller } = props;
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

      controller.onChangeListener(avustushaku, { id: "project-id" }, option.id);
      avustushaku["project-id"] = option.id;
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
          multipleProjectCodesEnabled={multipleProjectCodesEnabled}
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
              multipleProjectCodesEnabled={multipleProjectCodesEnabled}
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

function makeNoProjectCodeFirstElement(codeOptions: VaCodeValue[]) {
  const noProjectCodeInd = codeOptions.findIndex(
    (code: VaCodeValue) => code["code-value"] === "Ei projektikoodia"
  );
  const noProjectCode = codeOptions[noProjectCodeInd];
  codeOptions.splice(noProjectCodeInd, 1);
  return [noProjectCode, ...codeOptions];
}
