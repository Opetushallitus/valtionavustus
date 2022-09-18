import React from "react";

import PresenterComment from "./PresenterComment";
import SeurantaLiitteet from "./SeurantaLiitteet";
import SeurantaTags from "./SeurantaTags";
import SeurantaBudgetEditing from "../seurantabudgetedit/SeurantaBudgetEditing";
import ShouldPay from "./ShouldPay";
import AllowVisibilityInExternalSystem from "./AllowVisibilityInExternalSystem";
import ShouldPayComments from "./ShouldPayComments";
import { Avustushaku, Hakemus, HelpTexts } from "soresu-form/web/va/types";
import { HakuData } from "../types";
import { Muutoshakemus } from "soresu-form/web/va/types/muutoshakemus";

interface SeurantaProps {
  hakemus: Hakemus;
  avustushaku: Avustushaku;
  hakuData: HakuData;
  helpTexts: HelpTexts;
  muutoshakemukset?: Muutoshakemus[];
}

const Seuranta = ({
  hakemus,
  avustushaku,
  hakuData,
  helpTexts,
  muutoshakemukset,
}: SeurantaProps) => {
  return (
    <div className="seuranta">
      <AllowVisibilityInExternalSystem
        hakemus={hakemus}
        allowEditing={true}
        helpText={
          helpTexts[
            "hankkeen_sivu__seuranta___salli_näkyvyys_ulkoisessa_järjestelmässä"
          ]
        }
      />
      <ShouldPay
        hakemus={hakemus}
        allowEditing={true}
        helpText={helpTexts["hankkeen_sivu__seuranta___maksuun"]}
      />
      <ShouldPayComments />
      <div className="seuranta-section">
        <PresenterComment
          helpText={
            helpTexts["hankkeen_sivu__seuranta___valmistelijan_huomiot"]
          }
        />
        <SeurantaBudgetEditing
          avustushaku={avustushaku}
          hakuData={hakuData}
          hakemus={hakemus}
          muutoshakemukset={muutoshakemukset}
        />
      </div>
      <div className="seuranta-section">
        <SeurantaLiitteet
          avustushaku={avustushaku}
          hakuData={hakuData}
          hakemus={hakemus}
          helpText={helpTexts["hankkeen_sivu__seuranta___liitteet"]}
        />
      </div>
      <div className="seuranta-section">
        <SeurantaTags hakemus={hakemus} />
      </div>
    </div>
  );
};

export default Seuranta;
