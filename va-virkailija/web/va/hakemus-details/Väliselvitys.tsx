import React from "react";

import SelvitysPreview from "./SelvitysPreview";
import SelvitysNotFilled from "./SelvitysNotFilled";
import SelvitysLink from "./SelvitysLink";
import PresenterComment from "./PresenterComment";
import ApplicationPayments from "./ApplicationPayments";
import { ValiselvitysEmail } from "./ValiselvitysEmail";
import {
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from "../hakemustenArviointi/arviointiStore";
import {
  addPayment,
  getLoadedState,
  getSelectedHakemus,
  hasMultibatchPayments,
  removePayment,
  getUserRoles,
} from "../hakemustenArviointi/arviointiReducer";

const Väliselvitys = () => {
  const hakemus = useHakemustenArviointiSelector(getSelectedHakemus);
  const { hakuData, helpTexts, userInfo } = useHakemustenArviointiSelector(
    (state) => getLoadedState(state.arviointi)
  );
  const { avustushaku } = hakuData;
  const multibatchPaymentsEnabled = useHakemustenArviointiSelector(
    hasMultibatchPayments
  );
  const valiselvitysPyynnotSent = useHakemustenArviointiSelector(
    (state) =>
      getLoadedState(state.arviointi).lahetykset.valiselvitysPyynnostSentAt !==
      undefined
  );
  const presenterCommentHelpText =
    helpTexts["hankkeen_sivu__arviointi___valmistelijan_huomiot"];
  const selvitysLinkHelpText =
    helpTexts["hankkeen_sivu__väliselvitys___linkki_lomakkeelle"];
  const hasSelvitysAnswers = !!hakemus.selvitys?.valiselvitys?.answers;
  const valiselvitys = hakemus.selvitys?.valiselvitys;
  const form = hakemus.selvitys?.valiselvitysForm;
  const { isPresentingOfficer } = useHakemustenArviointiSelector(getUserRoles);
  const dispatch = useHakemustenArviointiDispatch();
  return (
    <div id="tab-content" className={hakemus.refused ? "disabled" : ""}>
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
        {multibatchPaymentsEnabled && (
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
    </div>
  );
};

export default Väliselvitys;
