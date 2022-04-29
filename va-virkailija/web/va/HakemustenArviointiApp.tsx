import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
// @ts-ignore route-parser doesn't have proper types
import RouteParser from "route-parser";
import queryString from "query-string";

import HakemustenArviointiController from "./HakemustenArviointiController";
import HakemusListing from "./hakemus-list/HakemusListing.jsx";
import HakemusDetails from "./hakemus-details/HakemusDetails";
import HakemusHakijaSidePreviewLink from "./hakemus-details/HakemusHakijaSidePreviewLink";
import HakemusDecisionLink from "./hakemus-details/HakemusDecisionLink";
import AvustushakuDropdown from "./avustushaku/AvustushakuDropdown";
import HakemusFilter from "./hakemus-filter/HakemusFilter";
import LocalStorage from "./LocalStorage";

import "./style/main.less";

import "./hakemusten-arviointi.less";
import { State } from "./types";
import NewHakemusListing from "./hakemus-list/NewHakemusListing";
import { Hakemus } from "soresu-form/web/va/types";
import { Switch } from "./hakemus-list/Switch";
import { HeaderContainer } from "./Header";
import { AvustushakuDetails } from "./hakemus-list/AvustushakuDetails";

interface Props {
  state: State;
  controller: HakemustenArviointiController;
  newHakemusListingUiEnabled: boolean;
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
    previouslySelectedHakemus,
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
  const selectedHakemus: Hakemus | undefined | {} = hasSelected
    ? state.selectedHakemus
    : {};
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
                lahetykset={state.lahetykset}
                vastuuvalmistelija={hakuData.roles.find(
                  (r) => r.role === "vastuuvalmistelija"
                )}
                toimintayksikko={hakuData.toimintayksikko}
                earliestPaymentCreatedAt={state.earliestPaymentCreatedAt}
              />
            )}
          </div>
          {newHakemusListingUiEnabled ? (
            <NewHakemusListing
              selectedHakemus={selectedHakemus}
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
          ) : (
            <HakemusListing
              ophShareSum={hakuData["budget-oph-share-sum"]}
              budgetGrantedSum={hakuData["budget-granted-sum"]}
              hakemusFilter={state.hakemusFilter}
              hakemusSorter={state.hakemusSorter}
              hakemusList={hakemusList}
              hasSelected={hasSelected}
              selectedHakemus={selectedHakemus}
              previouslySelectedHakemus={previouslySelectedHakemus}
              userInfo={state.userInfo}
              privileges={hakuData.privileges}
              controller={controller}
              avustushaku={avustushaku}
              environment={environment}
              toggleSplitView={toggleSplitView}
              state={state}
            />
          )}
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
        />
        <div hidden={!hasSelected} id="footer">
          <HakemusHakijaSidePreviewLink
            hakemus={selectedHakemus}
            avustushaku={avustushaku}
          />
          <HakemusDecisionLink
            hakemus={selectedHakemus}
            avustushaku={avustushaku}
          />
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
const newHakemusListingUiEnabled = query["new-hakemus-listing-ui"] === "true";
const evaluator = query.arvioija ? parseInt(query.arvioija) : undefined;
const controller = new HakemustenArviointiController();
const stateP = controller.initializeState(avustushakuId, evaluator);

stateP.onValue((state) => {
  if (state.hakuData && state.userInfo) {
    ReactDOM.render(
      <App
        state={state}
        controller={controller}
        newHakemusListingUiEnabled={newHakemusListingUiEnabled}
      />,
      document.getElementById("app")
    );
  }
});
