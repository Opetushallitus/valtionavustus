import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
// @ts-ignore route-parser doesn't have proper types
import RouteParser from "route-parser";
import queryString from "query-string";

import HakemustenArviointiController from "./HakemustenArviointiController";
import HakemusDetails from "./hakemus-details/HakemusDetails";
import { HakemusHakijaSidePreviewLink } from "./hakemus-details/HakemusHakijaSidePreviewLink";
import HakemusDecisionLink from "./hakemus-details/HakemusDecisionLink";
import AvustushakuDropdown from "./avustushaku/AvustushakuDropdown";
import HakemusFilter from "./hakemus-filter/HakemusFilter";
import LocalStorage from "./LocalStorage";
import { State } from "./types";
import HakemusListing from "./hakemus-list/HakemusListing";
import { Switch } from "./hakemus-list/Switch";
import { HeaderContainer } from "./Header";
import { AvustushakuDetails } from "./hakemus-list/AvustushakuDetails";

import "./style/main.less";
import "./hakemusten-arviointi.less";

interface Props {
  state: State;
  controller: HakemustenArviointiController;
}

const SHOW_ALL = "showAll" as const;
const SHOW_ADDITIONAL_INFO = "showAdditionalInfo" as const;

const setUrlParams = (key: string, value: boolean) => {
  const searchParams = new URLSearchParams(location.search);
  searchParams.set(key, String(value));
  const newUrl = `${location.pathname}?${searchParams.toString()}`;
  history.replaceState(null, document.title, newUrl);
};

const App = ({ state, controller }: Props) => {
  const [showAllHakemukset, toggleShowAllHakemukset] = useState(
    () => new URLSearchParams(location.search).get(SHOW_ALL) === "true"
  );
  const {
    avustushakuList,
    hakuData,
    helpTexts,
    modal,
    saveStatus,
    selectedHakemusAccessControl,
    subTab,
    userInfo,
  } = state;
  const { avustushaku, environment, hakemukset } = hakuData;
  const hakemusList = showAllHakemukset
    ? hakemukset
    : HakemustenArviointiController.filterHakemukset(hakemukset);
  const hasSelected = typeof state.selectedHakemus === "object";
  const [splitView, setSplitView] = useState(false);
  const [showInfo, setShowInfo] = useState(
    () =>
      new URLSearchParams(location.search).get(SHOW_ADDITIONAL_INFO) === "true"
  );
  const toggleSplitView = (forceValue?: boolean) => {
    if (forceValue !== undefined) {
      setSplitView(forceValue);
    } else {
      setSplitView((current) => !current);
    }
  };
  const isResolved = avustushaku.status === "resolved";
  useEffect(() => {
    const escFunction = (event: KeyboardEvent) => {
      if (event.keyCode === 27) {
        controller.setModal(undefined);
      }
    };
    document.addEventListener("keydown", escFunction, false);
    return () => {
      document.removeEventListener("keydown", escFunction, false);
    };
  }, []);

  return (
    <section className={splitView ? "split-view" : ""}>
      <HeaderContainer
        activeTab="arviointi"
        environment={environment}
        userInfo={userInfo}
        saveStatus={saveStatus}
        avustushakuId={avustushaku.id}
      />
      <section className="section-container">
        <div id="list-container" className={hasSelected ? "has-selected" : ""}>
          <div id="list-heading">
            <AvustushakuDropdown
              avustushaku={avustushaku}
              avustushakuList={avustushakuList}
            />
            <div className="right-side">
              <button
                className="hakemus-btn"
                onClick={() => {
                  const newState = !showInfo;
                  setUrlParams(SHOW_ADDITIONAL_INFO, newState);
                  setShowInfo(newState);
                }}
              >
                {showInfo ? "Piilota" : "Näytä"} lisätiedot
              </button>
              <HakemusFilter
                controller={controller}
                hakemusFilter={state.hakemusFilter}
                form={hakuData.form}
                avustushaku={avustushaku}
                hakemukset={hakemusList}
              />
              {!isResolved && (
                <Switch
                  checked={showAllHakemukset}
                  onChange={() => {
                    const newState = !showAllHakemukset;
                    setUrlParams(SHOW_ALL, newState);
                    toggleShowAllHakemukset(newState);
                  }}
                  label="Näytä keskeneräiset"
                />
              )}
              <a
                className="excel-export"
                href={`/api/avustushaku/${avustushaku.id}/export.xslx`}
                target="_"
              >
                Lataa Excel
              </a>
            </div>
          </div>
          <div>
            {showInfo && (
              <AvustushakuDetails
                avustushaku={avustushaku}
                hakemusList={hakemusList}
                lahetykset={state.lahetykset}
                vastuuvalmistelija={hakuData.roles.find(
                  (r) => r.role === "vastuuvalmistelija"
                )}
                toimintayksikko={hakuData.toimintayksikko}
                earliestPaymentCreatedAt={state.earliestPaymentCreatedAt}
              />
            )}
          </div>
          <HakemusListing
            selectedHakemus={state.selectedHakemus}
            hakemusList={hakemusList}
            isResolved={isResolved}
            roles={hakuData.roles}
            splitView={splitView}
            onSelectHakemus={(id) => controller.selectHakemus(id)}
            onYhteenvetoClick={(filteredHakemusList) =>
              controller.gotoSavedSearch(filteredHakemusList)
            }
            toggleSplitView={toggleSplitView}
            controller={controller}
            state={state}
            userInfo={userInfo}
            allowHakemusScoring={hakuData.privileges["score-hakemus"]}
            additionalInfoOpen={showInfo}
          />
        </div>
        <HakemusDetails
          hakuData={hakuData}
          avustushaku={avustushaku}
          hakemus={state.selectedHakemus}
          selectedHakemusAccessControl={selectedHakemusAccessControl}
          userInfo={state.userInfo}
          showOthersScores={state.showOthersScores}
          subTab={subTab}
          controller={controller}
          environment={environment}
          splitView={splitView}
          toggleSplitView={toggleSplitView}
          helpTexts={helpTexts}
          projects={state.projects}
        />
        <div hidden={!hasSelected} id="footer">
          {state.selectedHakemus?.["user-key"] && (
            <>
              <HakemusHakijaSidePreviewLink
                hakemusUserKey={state.selectedHakemus["user-key"]}
                avustushakuId={avustushakuId}
              />
              <HakemusDecisionLink
                hakemus={state.selectedHakemus}
                avustushaku={avustushaku}
              />
            </>
          )}
        </div>
      </section>
      {modal}
    </section>
  );
};

const defaultHakuId = LocalStorage.avustushakuId() || 1;

const parsedAvustusHakuIdObject = new RouteParser(
  "/avustushaku/:avustushaku_id/*ignore"
).match(location.pathname);
if (!parsedAvustusHakuIdObject?.avustushaku_id) {
  window.location.href = "/avustushaku/" + defaultHakuId + "/";
}
const avustushakuId = parsedAvustusHakuIdObject
  ? parseInt(parsedAvustusHakuIdObject["avustushaku_id"], 10)
  : defaultHakuId;
LocalStorage.saveAvustushakuId(avustushakuId);
const query = queryString.parse(location.search);
const evaluator = query.arvioija ? parseInt(query.arvioija) : undefined;
const controller = new HakemustenArviointiController();
const stateP = controller.initializeState(avustushakuId, evaluator);

const app = document.getElementById("app");
const root = createRoot(app!);

stateP.onValue((state) => {
  if (state.hakuData && state.userInfo) {
    root.render(<App state={state} controller={controller} />);
  }
});
