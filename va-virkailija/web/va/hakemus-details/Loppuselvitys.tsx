import React from "react";

import { LoppuselvitysForm } from "./LoppuselvitysForm";
import { TaloustarkastusEmail } from "./TaloustarkastusEmail";
import SelvitysPreview from "./SelvitysPreview";
import SelvitysNotFilled from "./SelvitysNotFilled";
import SelvitysLink from "./SelvitysLink";
import PresenterComment from "./PresenterComment";
import ApplicationPayments from "./ApplicationPayments";
import { Avustushaku, Hakemus } from "soresu-form/web/va/types";
import { Role, UserInfo } from "../types";
import { EnvironmentApiResponse } from "soresu-form/web/va/types/environment";
import {
  addPayment,
  getLoadedState,
  removePayment,
} from "../hakemustenArviointi/arviointiReducer";
import {
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from "../hakemustenArviointi/arviointiStore";

type SelvitysProps = {
  hakemus: Hakemus;
  avustushaku: Avustushaku;
  userInfo: UserInfo;
  multibatchEnabled: boolean;
  isPresentingOfficer: boolean;
  presenterCommentHelpText: string;
  selvitysLinkHelpText: string;
  environment: EnvironmentApiResponse;
  presenter?: Role;
};

const Loppuselvitys = ({
  presenter,
  hakemus,
  avustushaku,
  userInfo,
  multibatchEnabled,
  isPresentingOfficer,
  presenterCommentHelpText,
  selvitysLinkHelpText,
}: SelvitysProps) => {
  const dispatch = useHakemustenArviointiDispatch();
  const loppuselvitysPyynnotSent = useHakemustenArviointiSelector(
    (state) =>
      getLoadedState(state.arviointi).lahetykset.loppuselvitysPyynnotSentAt !==
      undefined
  );
  const hasSelvitys = !!hakemus.selvitys?.loppuselvitys?.answers;
  const selvitysHakemus = hakemus.selvitys?.loppuselvitys;
  const form = hakemus.selvitys?.loppuselvitysForm;

  const loppuselvitysStatus = hakemus["status-loppuselvitys"];

  const loppuselvitys = hakemus.selvitys?.loppuselvitys;
  const renderTaloustarkastusEmail =
    loppuselvitysStatus === "information_verified" ||
    loppuselvitysStatus === "accepted";

  const lang = loppuselvitys?.language || "fi";
  return (
    <div
      className="selvitys-container"
      data-test-id="hakemus-details-loppuselvitys"
    >
      <PresenterComment helpText={presenterCommentHelpText} />
      {hasSelvitys ? (
        <SelvitysPreview
          hakemus={hakemus}
          avustushaku={avustushaku}
          selvitysType="loppuselvitys"
          selvitysHakemus={selvitysHakemus}
          form={form}
        />
      ) : (
        <SelvitysNotFilled
          avustushaku={avustushaku}
          selvitysType="loppuselvitys"
        />
      )}
      {multibatchEnabled && (avustushaku.content as any).multiplemaksuera && (
        <ApplicationPayments
          application={hakemus}
          grant={avustushaku}
          index={2}
          payments={hakemus.payments}
          onAddPayment={(paymentSum: number, index: number) => {
            dispatch(
              addPayment({
                paymentSum,
                index,
                hakemusId: hakemus.id,
                projectCode: hakemus.project?.code,
              })
            );
          }}
          onRemovePayment={(paymentId: number) =>
            dispatch(removePayment({ paymentId, hakemusId: hakemus.id }))
          }
          readonly={!isPresentingOfficer}
        />
      )}
      {loppuselvitysPyynnotSent && (
        <SelvitysLink
          avustushaku={avustushaku}
          hakemus={hakemus}
          selvitysType="loppuselvitys"
          helpText={selvitysLinkHelpText}
        />
      )}
      {hasSelvitys && (
        <LoppuselvitysForm
          hakemus={hakemus}
          avustushaku={avustushaku}
          presenter={presenter}
          userInfo={userInfo}
        />
      )}
      {loppuselvitys && renderTaloustarkastusEmail && (
        <TaloustarkastusEmail
          avustushakuId={avustushaku.id}
          hakemus={hakemus}
          loppuselvitys={loppuselvitys}
          lang={lang}
          userInfo={userInfo}
          avustushakuName={avustushaku.content.name[lang]}
        />
      )}
    </div>
  );
};

export default Loppuselvitys;
