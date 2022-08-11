import React from "react";
import { VaCodeValue } from "../types";
import ProjectSelector from "./ProjectSelector";

import "../style/projektien-valinta.less";
import {
  useHakujenHallintaDispatch,
  useHakujenHallintaSelector,
} from "../hakujenHallinta/hakujenHallintaStore";
import { Avustushaku, updateProjects } from "../hakujenHallinta/hakuReducer";

interface ProjectSelectorsProps {
  avustushaku: Avustushaku;
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
      projects[projectIndex] = option;
      dispatch(
        updateProjects({
          avustushakuId: avustushaku.id,
          projects,
        })
      );
    };

  const addRow = () => {
    dispatch(
      updateProjects({
        avustushakuId: avustushaku.id,
        projects: [codeOptions[0], ...projects],
      })
    );
  };

  const removeRow = (project: VaCodeValue | null) => () => {
    if (project) {
      const newProjects = projects.filter((p) => p.id !== project.id);
      dispatch(
        updateProjects({ avustushakuId: avustushaku.id, projects: newProjects })
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
