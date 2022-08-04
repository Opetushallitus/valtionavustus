import React from "react";
import { VaCodeValue } from "../types";
import { SelectedAvustushaku } from "../HakujenHallintaController";
import ProjectSelector from "./ProjectSelector";

import "../style/projektien-valinta.less";
import {
  useHakujenHallintaDispatch,
  useHakujenHallintaSelector,
} from "../hakujenHallinta/hakujenHallintaStore";
import {
  removeProjects,
  saveProjects,
  updateProjects,
} from "../hakujenHallinta/hakuReducer";

interface ProjectSelectorsProps {
  avustushaku: SelectedAvustushaku;
  codeOptions: VaCodeValue[];
  disabled: boolean;
  multipleProjectCodesEnabled: boolean;
}

export default function ProjectSelectors(props: ProjectSelectorsProps) {
  const loadingProjects = useHakujenHallintaSelector(
    (s) => s.haku.loadingProjects
  );
  const dispatch = useHakujenHallintaDispatch();
  const { avustushaku, multipleProjectCodesEnabled } = props;
  let { codeOptions, disabled } = props;
  const projects = [...(avustushaku.projects ?? [])].sort((a, b) =>
    a["code-value"].localeCompare(b["code-value"])
  );
  disabled = disabled || loadingProjects;

  codeOptions = makeNoProjectCodeFirstElement(codeOptions);

  const updateValue =
    (projectIndex: number) => (option: VaCodeValue | null) => {
      if (option === null) {
        return;
      }
      dispatch(
        updateProjects({
          avustushakuId: avustushaku.id,
          value: option,
          index: projectIndex,
        })
      );
      /*//TODO: Poista allaoleva tehdessäsi VA-286-6:sta
      if (option == null) {
        controller.onChangeListener(avustushaku, { id: "project-id" }, null);
        avustushaku["project-id"] = null;
      } else {
        controller.onChangeListener(
          avustushaku,
          { id: "project-id" },
          option.id
        );
        avustushaku["project-id"] = option.id;
      }*/
    };

  const addRow = () => {
    dispatch(
      saveProjects({ avustushakuId: avustushaku.id, value: codeOptions[0] })
    );
  };

  const removeRow = (project: VaCodeValue | null) => () => {
    if (project) {
      dispatch(
        removeProjects({ avustushakuId: avustushaku.id, value: project })
      );
    }
  };

  return (
    <div className="projekti-valitsimet">
      {projects.length < 1 ? (
        <ProjectSelector
          codeOptions={codeOptions.filter((k) => k["value-type"] === "project")}
          selectedValue={""}
          disabled={disabled}
          multipleProjectCodesEnabled={multipleProjectCodesEnabled}
          updateValue={updateValue(0)}
          removeRow={removeRow(null)}
          addRow={addRow}
        />
      ) : (
        projects.map((project, ind) => {
          return (
            <ProjectSelector
              key={`${project.id}-${ind}`}
              codeOptions={codeOptions.filter(
                (k) => k["value-type"] === "project"
              )}
              selectedValue={project}
              disabled={disabled}
              multipleProjectCodesEnabled={multipleProjectCodesEnabled}
              updateValue={updateValue(ind)}
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
