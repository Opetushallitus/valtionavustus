import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
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
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from "./hakemustenArviointi/arviointiStore";
import {
  getLoadedState,
  initialize,
} from "./hakemustenArviointi/arviointiReducer";
import { Hakemus } from "soresu-form/web/va/types";
import { MODAL_ROOT_ID } from "./hakemus-details/Modal";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { HakemusArviointi } from "./hakemus-details/HakemusArviointi";
import Väliselvitys from "./hakemus-details/Väliselvitys";
import Loppuselvitys from "./hakemus-details/Loppuselvitys";
import MuutoshakemusTabContent from "./hakemus-details/MuutoshakemusTabContent";
import Seuranta from "./hakemus-details/Seuranta";

const SHOW_ALL = "showAll" as const;
const SHOW_ADDITIONAL_INFO = "showAdditionalInfo" as const;

const defaultHakuId = LocalStorage.avustushakuId() || 1;

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

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="avustushaku/:avustushakuId" element={<App />}>
        <Route path="hakemus/:hakemusId" element={<HakemusDetails />}>
          <Route index element={<HakemusArviointi />} />
          <Route path="arviointi" element={<HakemusArviointi />} />
          <Route path="valiselvitys" element={<Väliselvitys />} />
          <Route path="loppuselvitys" element={<Loppuselvitys />} />
          <Route
            path="muutoshakemukset"
            element={<MuutoshakemusTabContent />}
          />
          <Route path="seuranta" element={<Seuranta />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={<Navigate to={`/avustushaku/${defaultHakuId}`} replace />}
      />
    </Routes>
  );
};

const App = () => {
  const initialDataLoading = useHakemustenArviointiSelector(
    (state) => state.arviointi.initialData.loading
  );
  if (initialDataLoading) {
    return <InitialApp />;
  }
  return <LoadedApp />;
};

const InitialApp = () => {
  const dispatch = useHakemustenArviointiDispatch();
  const { avustushakuId, hakemusId } = useParams();
  useEffect(() => {
    const routeParamAvustushakuId = Number(avustushakuId);
    const initializeWithAvustushakuId = isNaN(routeParamAvustushakuId)
      ? defaultHakuId
      : routeParamAvustushakuId;
    const routeParamsHakemusId = Number(hakemusId);
    dispatch(
      initialize({
        avustushakuId: initializeWithAvustushakuId,
        hakemusId: routeParamsHakemusId,
      })
    );
  }, []);
  return null;
};

const LoadedApp = () => {
  const [showAllHakemukset, toggleShowAllHakemukset] = useState(
    () => new URLSearchParams(location.search).get(SHOW_ALL) === "true"
  );
  const { avustushakuList, hakuData, userInfo } =
    useHakemustenArviointiSelector((state) => getLoadedState(state.arviointi));
  const { hakemusId } = useParams();
  const selectedHakemusId = hakemusId ? Number(hakemusId) : undefined;
  const saveStatus = useHakemustenArviointiSelector(
    (state) => state.arviointi.saveStatus
  );
  const { avustushaku, environment, hakemukset } = hakuData;
  const hakemusList = showAllHakemukset
    ? hakemukset
    : hakemukset.filter(unwantedHakemukset);
  const hasSelected = selectedHakemusId !== undefined;
  const [searchParams] = useSearchParams();
  const splitView = searchParams.get("splitView") === "true";
  const [showInfo, setShowInfo] = useState(
    () =>
      new URLSearchParams(location.search).get(SHOW_ADDITIONAL_INFO) === "true"
  );
  const isResolved = avustushaku.status === "resolved";
  const selectedHakemus = selectedHakemusId
    ? hakemusList.find((h) => h.id === selectedHakemusId)
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
            additionalInfoOpen={showInfo}
          />
        </div>
        <Outlet />
        <div hidden={!hasSelected} id="footer">
          {selectedHakemus?.["user-key"] && (
            <>
              <HakemusHakijaSidePreviewLink
                hakemusUserKey={selectedHakemus["user-key"]}
                avustushakuId={avustushaku.id}
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

const app = document.getElementById("app");
const root = createRoot(app!);

root.render(
  <BrowserRouter>
    <Provider store={store}>
      <React.Fragment>
        <AppRoutes />
        <div id={MODAL_ROOT_ID} />
      </React.Fragment>
    </Provider>
  </BrowserRouter>
);
