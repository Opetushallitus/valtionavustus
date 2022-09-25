import React, { useState } from "react";
import { createRoot } from "react-dom/client";
// @ts-ignore route-parser doesn't have proper types
import RouteParser from "route-parser";

import HakemusDetails from "./hakemus-details/HakemusDetails";
import { HakemusHakijaSidePreviewLink } from "./hakemus-details/HakemusHakijaSidePreviewLink";
import HakemusDecisionLink from "./hakemus-details/HakemusDecisionLink";
import AvustushakuDropdown from "./avustushaku/AvustushakuDropdown";
import HakemusFilter from "./hakemus-filter/HakemusFilter";
import LocalStorage from "./LocalStorage";
import HakemusListing from "./hakemus-list/HakemusListing";
import { Switch } from "./hakemus-list/Switch";
import { HeaderContainer } from "./Header";
import { AvustushakuDetails } from "./hakemus-list/AvustushakuDetails";

import "./style/main.less";
import "./hakemusten-arviointi.less";
import { Provider } from "react-redux";
import store, {
  useHakemustenArviointiSelector,
} from "./hakemustenArviointi/arviointiStore";
import {
  getLoadedState,
  initialize,
} from "./hakemustenArviointi/arviointiReducer";
import { Hakemus } from "soresu-form/web/va/types";
import { MODAL_ROOT_ID } from "./hakemus-details/Modal";

const SHOW_ALL = "showAll" as const;
const SHOW_ADDITIONAL_INFO = "showAdditionalInfo" as const;

const setUrlParams = (key: string, value: boolean) => {
  const searchParams = new URLSearchParams(location.search);
  searchParams.set(key, String(value));
  const newUrl = `${location.pathname}?${searchParams.toString()}`;
  history.replaceState(null, document.title, newUrl);
};

const unwantedHakemukset = ({ status }: Hakemus) => {
  return (
    status === "submitted" ||
    status === "pending_change_request" ||
    status === "officer_edit" ||
    status === "applicant_edit"
  );
};

const AppRoot = () => {
  const initialDataLoading = useHakemustenArviointiSelector(
    (state) => state.arviointi.initialData.loading
  );
  if (initialDataLoading) {
    return null;
  }
  return <App />;
};

const App = () => {
  const [showAllHakemukset, toggleShowAllHakemukset] = useState(
    () => new URLSearchParams(location.search).get(SHOW_ALL) === "true"
  );
  const selectedHakuId = useHakemustenArviointiSelector(
    (state) => state.arviointi.selectedHakuId
  );
  const { avustushakuList, hakuData, userInfo } =
    useHakemustenArviointiSelector((state) => getLoadedState(state.arviointi));
  const selectedHakemusId = useHakemustenArviointiSelector(
    (state) => state.arviointi.selectedHakuId
  );
  const saveStatus = useHakemustenArviointiSelector(
    (state) => state.arviointi.saveStatus
  );
  const { avustushaku, environment, hakemukset } = hakuData;
  const hakemusList = showAllHakemukset
    ? hakemukset
    : hakemukset.filter(unwantedHakemukset);
  const hasSelected = selectedHakemusId !== undefined;
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
  const selectedHakemus = selectedHakuId
    ? hakemusList.find((h) => h.id === selectedHakuId)
    : undefined;
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
              <HakemusFilter />
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
                acceptedHakemus={hakemusList.find(
                  (h) => h.arvio.status === "accepted"
                )}
              />
            )}
          </div>
          <HakemusListing
            selectedHakemus={selectedHakemus}
            hakemusList={hakemusList}
            isResolved={isResolved}
            splitView={splitView}
            toggleSplitView={toggleSplitView}
            additionalInfoOpen={showInfo}
          />
        </div>
        <HakemusDetails
          hakemus={selectedHakemus}
          splitView={splitView}
          toggleSplitView={toggleSplitView}
        />
        <div hidden={!hasSelected} id="footer">
          {selectedHakemus?.["user-key"] && (
            <>
              <HakemusHakijaSidePreviewLink
                hakemusUserKey={selectedHakemus["user-key"]}
                avustushakuId={avustushakuId}
              />
              <HakemusDecisionLink
                hakemus={selectedHakemus}
                avustushaku={avustushaku}
              />
            </>
          )}
        </div>
      </section>
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

const app = document.getElementById("app");
const root = createRoot(app!);

store.dispatch(initialize(avustushakuId));

root.render(
  <Provider store={store}>
    <React.Fragment>
      <AppRoot />
      <div id={MODAL_ROOT_ID} />
    </React.Fragment>
  </Provider>
);
