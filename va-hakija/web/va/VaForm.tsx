import React from 'react'
import _ from 'lodash'

// @ts-ignore
import HttpUtil from 'soresu-form/web/HttpUtil'

import FormContainer from 'soresu-form/web/form/FormContainer.jsx'
import Form from 'soresu-form/web/form/Form.jsx'
import FormPreview from 'soresu-form/web/form/FormPreview.jsx'

import VaHakemusRegisterNumber from 'va-common/web/va/VaHakemusRegisterNumber.jsx'
import VaChangeRequest from 'va-common/web/va/VaChangeRequest.jsx'

import VaFormTopbar from './VaFormTopbar.jsx'
import VaOldBrowserWarning from './VaOldBrowserWarning.jsx'

import GrantRefuse from './GrantRefuse.jsx'
import OpenContactsEdit from './OpenContactsEdit.jsx'

import './style/main.less'

const allowedStatuses = ["officer_edit", "submitted", "pending_change_request", "applicant_edit"]

interface VaFormProps {
  controller: any
  state: any
  hakemusType: string
  isExpired: boolean
  refuseGrant: boolean
  modifyApplication: boolean
  useBusinessIdSearch: boolean
}

export const VaForm = ({controller, state, hakemusType, isExpired, refuseGrant, modifyApplication, useBusinessIdSearch }: VaFormProps) => {
  const environment =  state.configuration.environment


    const registerNumber = _.get(state.saveStatus.savedObject, "register-number", undefined)
    const {saveStatus, configuration} = state
    const registerNumberDisplay = <VaHakemusRegisterNumber key="register-number"
                                                           registerNumber={registerNumber}
                                                           translations={configuration.translations}
                                                           lang={configuration.lang} />
    const changeRequest =  <VaChangeRequest key="change-request"
                                            hakemus={saveStatus.savedObject}
                                            translations={configuration.translations}
                                            lang={configuration.lang} />
    const headerElements = [registerNumberDisplay, changeRequest]
    const formContainerClass = configuration.preview ? FormPreview : Form
    const showGrantRefuse = configuration.preview && state.token && allowedStatuses.indexOf(saveStatus.savedObject.status) > -1 && refuseGrant
    const isInApplicantEditMode = () => "applicant_edit" === _.get(saveStatus.savedObject, "status")
    const showOpenContactsEditButton = !showGrantRefuse && modifyApplication && !isInApplicantEditMode()
    const { embedForMuutoshakemus } = configuration


    return(
      <div>
        <VaOldBrowserWarning lang={configuration.lang}
                             translations={configuration.translations.warning}
                             devel={configuration.develMode}
        />
        {!embedForMuutoshakemus && <VaFormTopbar controller={controller}
                      state={state}
                      hakemusType={hakemusType}
                      isExpired={isExpired} />}
        {!embedForMuutoshakemus && showGrantRefuse &&
          <GrantRefuse controller={controller} state={state}
                       onSubmit={controller.refuseApplication}
                       isTokenValid={state.tokenValidation
                         ? state.tokenValidation.valid : false}/>}
        {!embedForMuutoshakemus && showOpenContactsEditButton &&
          <OpenContactsEdit controller={controller} state={state}
                       onSubmit={controller.refuseApplication}
                       isTokenValid={state.tokenValidation
                         ? state.tokenValidation.valid : false}/>}
        <FormContainer controller={controller}
                       state={state}
                       formContainerClass={formContainerClass}
                       headerElements={headerElements}
                       infoElementValues={state.avustushaku}
                       hakemusType={hakemusType}
                       useBusinessIdSearch={useBusinessIdSearch}
                       modifyApplication={modifyApplication}
                       environment={environment}
                       standardizedFormFieldsEnabled={true}
        />
      </div>
    )
 }
