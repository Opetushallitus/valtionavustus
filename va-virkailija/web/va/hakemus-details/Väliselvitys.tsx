import React from "react";

import SelvitysPreview from "./SelvitysPreview";
import SelvitysNotFilled from "./SelvitysNotFilled";
import SelvitysLink from "./SelvitysLink";
import PresenterComment from "./PresenterComment";
import ApplicationPayments from "./ApplicationPayments";
import { Avustushaku, Hakemus } from "soresu-form/web/va/types";
import HakemustenArviointiController from "../HakemustenArviointiController";
import { Role, UserInfo } from "../types";
import { EnvironmentApiResponse } from "soresu-form/web/va/types/environment";
import { ValiselvitysEmail } from "./ValiselvitysEmail";

type SelvitysProps = {
  controller: HakemustenArviointiController;
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
  controller,
  hakemus,
  avustushaku,
  userInfo,
  multibatchEnabled,
  isPresentingOfficer,
  presenterCommentHelpText,
  selvitysLinkHelpText,
}: SelvitysProps) => {
  const hasSelvitysAnswers = !!hakemus.selvitys?.valiselvitys?.answers;
  const valiselvitys = hakemus.selvitys?.valiselvitys;
  const form = hakemus.selvitys?.valiselvitysForm;

  return (
    <div
      className="selvitys-container"
      data-test-id="hakemus-details-valiselvitys"
    >
      <PresenterComment
        controller={controller}
        hakemus={hakemus}
        helpText={presenterCommentHelpText}
      />
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
          onAddPayment={controller.addPayment}
          onRemovePayment={controller.removePayment}
          readonly={!isPresentingOfficer}
        />
      )}
      <SelvitysLink
        avustushaku={avustushaku}
        hakemus={hakemus}
        selvitysType="valiselvitys"
        helpText={selvitysLinkHelpText}
      />
      {valiselvitys && hasSelvitysAnswers && (
        <ValiselvitysEmail
          controller={controller}
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
