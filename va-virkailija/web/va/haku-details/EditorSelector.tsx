import React from "react";
import ClassNames from "classnames";

import { HelpTexts, Koodistos, Liite } from "soresu-form/web/va/types";
import { EnvironmentApiResponse } from "soresu-form/web/va/types/environment";

import { HakuEdit } from "./HakuEdit";
import FormEditorContainer from "./FormEditorContainer";
import DecisionEditor from "./DecisionEditor";
import { SelvitysFormEditor } from "./SelvitysFormEditor";
import HelpTooltip from "../HelpTooltip";
import { HakujenHallintaSubTab, UserInfo, VaCodeValue } from "../types";
import { Maksatukset } from "./Maksatukset";
import {
  useHakujenHallintaDispatch,
  useHakujenHallintaSelector,
} from "../hakujenHallinta/hakujenHallintaStore";
import {
  getSelectedHakuSelector,
  LainsaadantoOption,
  selectEditorSubTab,
} from "../hakujenHallinta/hakuReducer";

interface EditorSelectorProps {
  subTab: HakujenHallintaSubTab;
  decisionLiitteet: Liite[];
  koodistos: Koodistos;
  userInfo: UserInfo;
  environment: EnvironmentApiResponse;
  codeOptions: VaCodeValue[];
  lainsaadantoOptions: LainsaadantoOption[];
  helpTexts: HelpTexts;
}

function createRedirectTo(url: string) {
  return (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.preventDefault();
    window.location.href = url;
  };
}

export const EditorSelector = (props: EditorSelectorProps) => {
  const {
    subTab,
    decisionLiitteet,
    koodistos,
    userInfo,
    environment,
    codeOptions,
    lainsaadantoOptions,
    helpTexts,
  } = props;
  const state = useHakujenHallintaSelector((state) => state.haku);
  const avustushaku = useHakujenHallintaSelector(getSelectedHakuSelector);
  const dispatch = useHakujenHallintaDispatch();
  const formDraft = state.formDrafts[avustushaku.id];
  const formDraftJson = state.formDraftsJson[avustushaku.id];
  const valiselvitysFormDraft = state.valiselvitysFormDrafts[avustushaku.id];
  const valiselvitysFormDraftJson =
    state.valiselvitysFormDraftsJson[avustushaku.id];
  const loppuselvitysFormDraft = state.loppuselvitysFormDrafts[avustushaku.id];
  const loppuselvitysFormDraftJson =
    state.loppuselvitysFormDraftsJson[avustushaku.id];
  let subTabContent;
  switch (subTab) {
    case "haku-editor":
      subTabContent = (
        <HakuEdit
          avustushaku={avustushaku}
          userInfo={userInfo}
          codeOptions={codeOptions}
          lainsaadantoOptions={lainsaadantoOptions}
          helpTexts={helpTexts}
          environment={environment}
        />
      );
      break;
    case "form-editor":
      subTabContent = (
        <FormEditorContainer
          avustushaku={avustushaku}
          environment={environment}
          koodistos={koodistos}
          formDraft={formDraft}
          formDraftJson={formDraftJson}
          helpTexts={helpTexts}
        />
      );
      break;
    case "decision":
      subTabContent = (
        <DecisionEditor
          avustushaku={avustushaku}
          decisionLiitteet={decisionLiitteet}
          environment={environment}
          helpTexts={helpTexts}
        />
      );
      break;
    case "valiselvitys":
    case "loppuselvitys":
      subTabContent = (
        <SelvitysFormEditor
          selvitysType={subTab}
          environment={environment}
          avustushaku={avustushaku}
          koodistos={koodistos}
          formDraft={
            subTab === "valiselvitys"
              ? valiselvitysFormDraft
              : loppuselvitysFormDraft
          }
          formDraftJson={
            subTab === "valiselvitys"
              ? valiselvitysFormDraftJson
              : loppuselvitysFormDraftJson
          }
          helpTexts={helpTexts}
        />
      );
      break;
    case "maksatukset":
      subTabContent = (
        <Maksatukset
          avustushaku={avustushaku}
          codeValues={codeOptions}
          environment={environment}
          helpTexts={helpTexts}
          userInfo={userInfo}
        />
      );
      break;
    default:
      throw new Error(`Bad subTab selection '${subTab}'`);
  }

  function createSubTabSelector(subTabToSelect: HakujenHallintaSubTab) {
    return (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
      e.preventDefault();
      dispatch(selectEditorSubTab(subTabToSelect));
    };
  }

  return (
    <section id="editor-section">
      <div id="editor-subtab-selector" className="section-container">
        <span
          onClick={createSubTabSelector("haku-editor")}
          data-test-id="haun-tiedot-välilehti"
          className={ClassNames({ selected: subTab === "haku-editor" })}
        >
          Haun tiedot
          <HelpTooltip
            content={
              helpTexts["hakujen_hallinta__haun_tiedot___valilehden_infopallo"]
            }
            direction="left"
          />
        </span>
        <span
          onClick={createSubTabSelector("form-editor")}
          className={ClassNames({ selected: subTab === "form-editor" })}
        >
          Hakulomake
          <HelpTooltip
            content={
              helpTexts["hakujen_hallinta__hakulomake___valilehden_infopallo"]
            }
          />
        </span>
        <span
          onClick={createSubTabSelector("decision")}
          className={ClassNames({ selected: subTab === "decision" })}
          data-test-id="päätös-välilehti"
        >
          Päätös
          <HelpTooltip
            content={
              helpTexts[
                "hakujen_hallinta__päätös___välilehden_infopallo_välilehtiriville"
              ]
            }
          />
        </span>
        <span
          onClick={createSubTabSelector("valiselvitys")}
          className={ClassNames({ selected: subTab === "valiselvitys" })}
          data-test-id="väliselvitys-välilehti"
        >
          Väliselvitys
          <HelpTooltip
            content={
              helpTexts[
                "hakujen_hallinta__väliselvitys___välilehden_infopallo_välilehtiriville"
              ]
            }
          />
        </span>
        <span
          onClick={createSubTabSelector("loppuselvitys")}
          className={ClassNames({ selected: subTab === "loppuselvitys" })}
          data-test-id="loppuselvitys-välilehti"
        >
          Loppuselvitys
          <HelpTooltip
            content={
              helpTexts[
                "hakujen_hallinta__loppuselvitys___välilehden_infopallo_välilehtiriville"
              ]
            }
          />
        </span>
        <span
          onClick={
            environment["maksatukset-typescript"]?.["enabled?"]
              ? createSubTabSelector("maksatukset")
              : createRedirectTo(
                  "/admin-ui/payments/?grant-id=" + avustushaku.id
                )
          }
          className={
            avustushaku.status !== "published" &&
            avustushaku.status !== "resolved"
              ? "disabled"
              : ClassNames({ selected: subTab === "maksatukset" })
          }
        >
          Maksatukset
          <HelpTooltip
            content={
              helpTexts[
                "hakujen_hallinta__maksatus___välilehden_infopallo_välilehtiriville"
              ]
            }
            direction="right"
          />
        </span>
      </div>
      <div
        className={
          subTab !== "maksatukset"
            ? "section-container"
            : "maksatukset-container"
        }
      >
        {subTabContent}
      </div>
    </section>
  );
};
