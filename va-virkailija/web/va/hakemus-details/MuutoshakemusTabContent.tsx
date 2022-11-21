import { Muutoshakemus } from "./Muutoshakemus";
import React from "react";
import { useHakemustenArviointiSelector } from "../hakemustenArviointi/arviointiStore";
import {
  getLoadedState,
  getSelectedHakemus,
} from "../hakemustenArviointi/arviointiReducer";

const MuutoshakemusTabContent = () => {
  const hakemus = useHakemustenArviointiSelector(getSelectedHakemus);
  const { hakuData, userInfo } = useHakemustenArviointiSelector((state) =>
    getLoadedState(state.arviointi)
  );
  const { avustushaku, environment } = hakuData;
  const { muutoshakemukset, language } = hakemus;
  const lang = language || "fi";
  const muutoshakemusUrl = `${environment["hakija-server"].url[lang]}muutoshakemus?lang=${lang}&user-key=${hakemus["user-key"]}&avustushaku-id=${avustushaku.id}`;
  return (
    <div id="tab-content" className={hakemus.refused ? "disabled" : ""}>
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
          userInfo={userInfo}
        />
      ) : (
        <h2>Hankkeella ei ole muutoshakemuksia</h2>
      )}
    </div>
  );
};

export default MuutoshakemusTabContent;
