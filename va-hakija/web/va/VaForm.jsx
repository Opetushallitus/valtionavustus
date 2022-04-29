import React from "react";
import _ from "lodash";

import FormContainer from "soresu-form/web/form/FormContainer.jsx";
import Form from "soresu-form/web/form/Form.jsx";
import FormPreview from "soresu-form/web/form/FormPreview.jsx";

import VaHakemusRegisterNumber from "soresu-form/web/va/VaHakemusRegisterNumber.jsx";
import VaChangeRequest from "soresu-form/web/va/VaChangeRequest.jsx";
import { mapAnswersWithMuutoshakemusData } from "soresu-form/web/va/MuutoshakemusMapper";

import VaFormTopbar from "./VaFormTopbar.tsx";
import VaOldBrowserWarning from "./VaOldBrowserWarning.jsx";

import GrantRefuse from "./GrantRefuse.jsx";
import OpenContactsEdit from "./OpenContactsEdit.jsx";

import "./style/main.less";

const allowedStatuses = [
  "officer_edit",
  "submitted",
  "pending_change_request",
  "applicant_edit",
];

export default class VaForm extends React.Component {
  render() {
    const {
      controller,
      state,
      hakemusType,
      isExpired,
      refuseGrant,
      modifyApplication,
    } = this.props;
    const registerNumber = _.get(
      state.saveStatus.savedObject,
      "register-number",
      undefined
    );
    const { saveStatus, configuration } = state;
    const { embedForMuutoshakemus, preview } = configuration;
    const registerNumberDisplay = (
      <VaHakemusRegisterNumber
        key="register-number"
        registerNumber={registerNumber}
        translations={configuration.translations}
        lang={configuration.lang}
      />
    );
    const changeRequest = (
      <VaChangeRequest
        key="change-request"
        hakemus={saveStatus.savedObject}
        translations={configuration.translations}
        lang={configuration.lang}
      />
    );
    const headerElements = [registerNumberDisplay, changeRequest];
    const isLoppuselvitysInformationVerified =
      hakemusType === "loppuselvitys" &&
      state.saveStatus &&
      state.saveStatus.savedObject &&
      state.saveStatus.savedObject["loppuselvitys-information-verified-at"];
    const formContainerClass =
      preview || isLoppuselvitysInformationVerified ? FormPreview : Form;
    const showGrantRefuse =
      preview &&
      state.token &&
      allowedStatuses.indexOf(saveStatus.savedObject.status) > -1 &&
      refuseGrant === "true";
    const isInApplicantEditMode = () =>
      "applicant_edit" === _.get(saveStatus.savedObject, "status");
    const showOpenContactsEditButton =
      !showGrantRefuse && modifyApplication && !isInApplicantEditMode();
    if (!embedForMuutoshakemus && preview) {
      saveStatus.values.value = mapAnswersWithMuutoshakemusData(
        state.avustushaku,
        saveStatus.values.value,
        state.muutoshakemukset,
        state.normalizedHakemus
      );
    }

    return (
      <div>
        <VaOldBrowserWarning
          lang={configuration.lang}
          translations={configuration.translations.warning}
        />
        {!embedForMuutoshakemus && (
          <VaFormTopbar
            controller={controller}
            state={state}
            hakemusType={hakemusType}
            isExpired={isExpired}
          />
        )}
        {!embedForMuutoshakemus && showGrantRefuse && (
          <GrantRefuse
            controller={controller}
            state={state}
            onSubmit={controller.refuseApplication}
            isTokenValid={
              state.tokenValidation ? state.tokenValidation.valid : false
            }
          />
        )}
        {!embedForMuutoshakemus && showOpenContactsEditButton && (
          <OpenContactsEdit
            controller={controller}
            state={state}
            onSubmit={controller.refuseApplication}
            isTokenValid={
              state.tokenValidation ? state.tokenValidation.valid : false
            }
          />
        )}
        <FormContainer
          controller={controller}
          state={state}
          formContainerClass={formContainerClass}
          headerElements={headerElements}
          infoElementValues={state.avustushaku}
          hakemusType={this.props.hakemusType}
          useBusinessIdSearch={this.props.useBusinessIdSearch}
          modifyApplication={modifyApplication}
        />
      </div>
    );
  }
}
