import React from "react";

import SelvitysPreview from "./SelvitysPreview";
import SelvitysNotFilled from "./SelvitysNotFilled";
import SelvitysLink from "./SelvitysLink";
import PresenterComment from "./PresenterComment";
import ApplicationPayments from "./ApplicationPayments";
import { Avustushaku, Hakemus } from "soresu-form/web/va/types";
import { Role, UserInfo } from "../types";
import { EnvironmentApiResponse } from "soresu-form/web/va/types/environment";
import { ValiselvitysEmail } from "./ValiselvitysEmail";
import {
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from "../hakemustenArviointi/arviointiStore";
import {
  addPayment,
  getLoadedState,
  removePayment,
} from "../hakemustenArviointi/arviointiReducer";

type SelvitysProps = {
  hakemus: Hakemus;
  avustushaku: Avustushaku;
  userInfo: UserInfo;
  multibatchEnabled: boolean;
  isPresentingOfficer: boolean;
  presenterCommentHelpText: any;
  selvitysLinkHelpText: any;
  environment: EnvironmentApiResponse;
  presenter?: Role;
};

const Väliselvitys = ({
  hakemus,
  avustushaku,
  userInfo,
  multibatchEnabled,
  isPresentingOfficer,
  presenterCommentHelpText,
  selvitysLinkHelpText,
}: SelvitysProps) => {
  const valiselvitysPyynnotSent = useHakemustenArviointiSelector(
    (state) =>
      getLoadedState(state.arviointi).lahetykset.valiselvitysPyynnostSentAt !==
      undefined
  );
  const hasSelvitysAnswers = !!hakemus.selvitys?.valiselvitys?.answers;
  const valiselvitys = hakemus.selvitys?.valiselvitys;
  const form = hakemus.selvitys?.valiselvitysForm;
  const dispatch = useHakemustenArviointiDispatch();
  return (
    <div
      className="selvitys-container"
      data-test-id="hakemus-details-valiselvitys"
    >
      <PresenterComment helpText={presenterCommentHelpText} />
      {hasSelvitysAnswers ? (
        <SelvitysPreview
          hakemus={hakemus}
          avustushaku={avustushaku}
          selvitysType="valiselvitys"
          selvitysHakemus={valiselvitys}
          form={form}
        />
      ) : (
        <SelvitysNotFilled
          avustushaku={avustushaku}
          selvitysType="valiselvitys"
        />
      )}
      {multibatchEnabled && (avustushaku.content as any).multiplemaksuera && (
        <ApplicationPayments
          application={hakemus}
          grant={avustushaku}
          index={1}
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
      {valiselvitysPyynnotSent && (
        <SelvitysLink
          avustushaku={avustushaku}
          hakemus={hakemus}
          selvitysType="valiselvitys"
          helpText={selvitysLinkHelpText}
        />
      )}
      {valiselvitys && hasSelvitysAnswers && (
        <ValiselvitysEmail
          hakemus={hakemus}
          avustushaku={avustushaku}
          valiselvitys={valiselvitys}
          userInfo={userInfo}
          lang={hakemus.language}
        />
      )}
    </div>
  );
};

export default Väliselvitys;
