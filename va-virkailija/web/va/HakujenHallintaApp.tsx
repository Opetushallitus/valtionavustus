import React, { useCallback } from "react";
import { createRoot } from "react-dom/client";
import moment from "moment";
// @ts-ignore react-widgets-moment doesn't have proper types
import MomentLocalizer from "react-widgets-moment";
import Localization from "react-widgets/Localization";

import { HeaderContainer } from "./Header";
import HakujenHallintaController, {
  Avustushaku,
  State,
} from "./HakujenHallintaController";
import { HakuListing } from "./haku-list/HakuListing";
import { EditorSelector } from "./haku-details/EditorSelector";
import LocalStorage from "./LocalStorage";
import { translationsFi } from "soresu-form/web/va/i18n/translations";

import "./style/virkailija.less";
import "./style/admin.less";
import { NewHakuListing } from "./haku-list/NewHakuListing";

interface HakujenHallintaAppProps {
  state: State;
  controller: HakujenHallintaController;
}

moment.locale("fi");
const momentLocalizer = new MomentLocalizer(moment);

const HakujenHallintaApp = ({ state, controller }: HakujenHallintaAppProps) => {
  const {
    environment,
    selectedHaku,
    codeOptions,
    lainsaadantoOptions,
    helpTexts,
    saveStatus,
    userInfo,
  } = state;
  const searchParams = new URLSearchParams(window.location.search);
  const newHakuListing = searchParams.get("new-haku-listing") === "true";
  const onClickHaku = useCallback((avustushaku: Avustushaku) => {
    controller.selectHaku(avustushaku)();
  }, []);
  return (
    <Localization date={momentLocalizer} messages={translationsFi.calendar}>
      <HeaderContainer
        activeTab="admin"
        environment={environment}
        userInfo={userInfo}
        saveStatus={saveStatus}
      />
      <section>
        {newHakuListing ? (
          <NewHakuListing
            hakuList={state.hakuList}
            selectedHaku={state.selectedHaku}
            onClickHaku={onClickHaku}
          />
        ) : (
          <HakuListing
            hakuList={state.hakuList}
            selectedHaku={state.selectedHaku}
            filter={state.filter}
            controller={controller}
          />
        )}
        <EditorSelector
          state={state}
          subTab={state.subTab}
          avustushaku={selectedHaku}
          decisionLiitteet={state.decisionLiitteet}
          formDraft={state.formDrafts[selectedHaku.id]}
          formDraftJson={state.formDraftsJson[selectedHaku.id]}
          valiselvitysFormDraft={state.valiselvitysFormDrafts[selectedHaku.id]}
          valiselvitysFormDraftJson={
            state.valiselvitysFormDraftsJson[selectedHaku.id]
          }
          loppuselvitysFormDraft={
            state.loppuselvitysFormDrafts[selectedHaku.id]
          }
          loppuselvitysFormDraftJson={
            state.loppuselvitysFormDraftsJson[selectedHaku.id]
          }
          environment={environment}
          koodistos={state.koodistos}
          userInfo={state.userInfo}
          controller={controller}
          codeOptions={codeOptions}
          lainsaadantoOptions={lainsaadantoOptions}
          helpTexts={helpTexts}
        />
      </section>
    </Localization>
  );
};

const controller = new HakujenHallintaController();
const hakuId = LocalStorage.avustushakuId() || 1;
const stateP = controller.initializeState(hakuId);

const app = document.getElementById("app");
const root = createRoot(app!);

stateP.onValue(function (state) {
  if (state.hakuList) {
    root.render(<HakujenHallintaApp state={state} controller={controller} />);
  }
});
