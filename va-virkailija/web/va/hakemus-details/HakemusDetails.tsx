import React from "react";

import HakemusPreview from "./HakemusPreview";
import { HakemusArviointi } from "./HakemusArviointi";
import { Muutoshakemus } from "./Muutoshakemus";
import Loppuselvitys from "./Loppuselvitys";
import Väliselvitys from "./Väliselvitys";
import Seuranta from "./Seuranta";
import {
  HakuData,
  SelectedHakemusAccessControl,
  UserInfo,
  VALMISTELIJA_ROLES,
  VaCodeValue,
} from "../types";
import { Avustushaku, Hakemus, HelpTexts } from "soresu-form/web/va/types";
import HakemustenArviointiController from "../HakemustenArviointiController";
import { EnvironmentApiResponse } from "soresu-form/web/va/types/environment";

import "./hakemusDetails.less";

interface Props {
  hakuData: HakuData;
  avustushaku: Avustushaku;
  hakemus: Hakemus | undefined;
  selectedHakemusAccessControl: SelectedHakemusAccessControl;
  userInfo: UserInfo;
  showOthersScores: boolean;
  subTab: string;
  controller: HakemustenArviointiController;
  environment: EnvironmentApiResponse;
  helpTexts: HelpTexts;
  splitView: boolean;
  toggleSplitView: (forceValue?: boolean) => void;
  projects: VaCodeValue[];
}

export const HakemusDetails = (props: Props) => {
  const {
    controller,
    hakemus,
    avustushaku,
    hakuData,
    userInfo,
    showOthersScores,
    environment,
    splitView,
    selectedHakemusAccessControl,
    subTab,
    helpTexts,
    toggleSplitView,
    projects,
  } = props;
  if (!(typeof hakemus === "object")) {
    return null;
  }

  const multibatchEnabled = Boolean(
    environment["multibatch-payments"]?.["enabled?"]
  );
  const userOid = userInfo["person-oid"];
  const userRole = hakuData.roles.find((r) => r.oid === userOid);
  const isPresentingOfficer = (VALMISTELIJA_ROLES as any).includes(
    userRole?.role
  );
  const muutoshakemukset = hakemus.muutoshakemukset;
  const fallbackPresenter = hakuData.roles.find((r) =>
    (VALMISTELIJA_ROLES as any).includes(r.role)
  );
  const hakemukselleUkotettuValmistelija =
    hakuData.roles.find((r) => r.id === hakemus.arvio["presenter-role-id"]) ||
    fallbackPresenter;
  const isCurrentUserHakemukselleUkotettuValmistelija =
    hakemukselleUkotettuValmistelija?.oid === userOid;
  const lang = hakemus.language || "fi";
  const muutoshakemusUrl = `${environment["hakija-server"].url[lang]}muutoshakemus?lang=${lang}&user-key=${hakemus["user-key"]}&avustushaku-id=${avustushaku.id}`;

  const onClose = () => {
    toggleSplitView(false);
    controller.closeHakemusDetail();
  };

  const onToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextToggle = !splitView;
    toggleSplitView(nextToggle);
    if (nextToggle) {
      const container = document.querySelector(
        ".hakemus-list tbody.has-selected"
      );
      const selected = document.querySelector<HTMLTableRowElement>(
        "#list-container tbody.has-selected .overview-row.selected"
      );
      if (container && selected?.offsetTop) {
        container.scrollTop = selected.offsetTop - 100;
      }
    }
    return false;
  };

  const getSubTab = (tabName: string) => {
    switch (tabName) {
      case "arviointi":
        return (
          <HakemusArviointi
            hakemus={hakemus}
            avustushaku={avustushaku}
            hakuData={hakuData}
            selectedHakemusAccessControl={selectedHakemusAccessControl}
            userInfo={userInfo}
            showOthersScores={showOthersScores}
            controller={controller}
            multibatchEnabled={multibatchEnabled}
            helpTexts={helpTexts}
            newTaTiliSelectionEnabled={
              environment["ta-tilit"]?.["enabled?"] === true
            }
            projects={projects}
          />
        );

      case "valiselvitys":
        return (
          <Väliselvitys
            environment={environment}
            controller={controller}
            hakemus={hakemus}
            avustushaku={avustushaku}
            userInfo={userInfo}
            presenter={hakemukselleUkotettuValmistelija}
            multibatchEnabled={multibatchEnabled}
            isPresentingOfficer={isPresentingOfficer}
            selvitysLinkHelpText={
              helpTexts["hankkeen_sivu__väliselvitys___linkki_lomakkeelle"]
            }
            presenterCommentHelpText={
              helpTexts["hankkeen_sivu__arviointi___valmistelijan_huomiot"]
            }
          />
        );
      case "loppuselvitys":
        return (
          <Loppuselvitys
            environment={environment}
            controller={controller}
            hakemus={hakemus}
            avustushaku={avustushaku}
            userInfo={userInfo}
            presenter={hakemukselleUkotettuValmistelija}
            multibatchEnabled={multibatchEnabled}
            isPresentingOfficer={isPresentingOfficer}
            selvitysLinkHelpText={
              helpTexts["hankkeen_sivu__loppuselvitys___linkki_lomakkeelle"]
            }
            presenterCommentHelpText={
              helpTexts["hankkeen_sivu__loppuselvitys___valmistelijan_huomiot"]
            }
          />
        );
      case "muutoshakemukset":
        return (
          <>
            {avustushaku.muutoshakukelpoinen && (
              <div className="muutoshakemus-link">
                <a
                  href={muutoshakemusUrl}
                  target="_blank"
                  data-test-id="muutoshakemus-link"
                >
                  Linkki muutoshakemuslomakkeeseen
                </a>
              </div>
            )}
            {muutoshakemukset?.length ? (
              <Muutoshakemus
                environment={environment}
                avustushaku={avustushaku}
                muutoshakemukset={muutoshakemukset}
                hakemusVersion={hakemus}
                controller={controller}
                userInfo={userInfo}
                presenter={hakemukselleUkotettuValmistelija}
                isCurrentUserHakemukselleUkotettuValmistelija={
                  isCurrentUserHakemukselleUkotettuValmistelija
                }
              />
            ) : (
              <h2>Hankkeella ei ole muutoshakemuksia</h2>
            )}
          </>
        );
      case "seuranta":
        return (
          <Seuranta
            controller={controller}
            hakemus={hakemus}
            avustushaku={avustushaku}
            muutoshakemukset={muutoshakemukset}
            hakuData={hakuData}
            helpTexts={helpTexts}
          />
        );
      default:
        throw new Error("Bad subTab selection '" + tabName + "'");
    }
  };

  const tab = (name: string, label: string | JSX.Element, testId?: string) => (
    <span
      className={subTab === name ? "selected" : ""}
      data-test-id={testId}
      onClick={createSubTabSelector(name)}
    >
      {label}
    </span>
  );

  function createSubTabSelector(subTabToSelect: string) {
    return (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
      e.preventDefault();
      controller.selectEditorSubtab(subTabToSelect);
    };
  }

  const MuutoshakemuksetLabel = () => (
    <span className="muutoshakemus-tab">
      Muutoshakemukset
      <span
        className={
          muutoshakemukset?.some((m) => m.status === "new")
            ? "muutoshakemukset-warning"
            : ""
        }
      >
        (
        <span data-test-id="number-of-pending-muutoshakemukset">
          {muutoshakemukset ? muutoshakemukset.length : 0}
        </span>
        )
      </span>
    </span>
  );

  return (
    <div id="hakemus-details">
      <button id="close-hakemus-button" onClick={onClose}>
        &times;
      </button>
      <button id="toggle-hakemus-list-button" onClick={onToggle}>
        ↕
      </button>
      <HakemusPreview
        hakemus={hakemus}
        avustushaku={avustushaku}
        hakuData={hakuData}
      />
      <div className="arviointi-container">
        <div
          id="editor-subtab-selector"
          className="fixed-tabs section-container"
        >
          {tab("arviointi", "Arviointi")}
          {tab("valiselvitys", "Väliselvitys")}
          {tab("loppuselvitys", "Loppuselvitys")}
          {tab("muutoshakemukset", <MuutoshakemuksetLabel />)}
          {tab("seuranta", "Seuranta", "tab-seuranta")}
        </div>
        <div id="hakemus-arviointi" className="fixed-content">
          <div id="tab-content" className={hakemus.refused ? "disabled" : ""}>
            {getSubTab(subTab)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HakemusDetails;
