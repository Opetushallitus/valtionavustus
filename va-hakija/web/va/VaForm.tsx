import React, { useEffect } from 'react'

import FormContainer from 'soresu-form/web/form/FormContainer'
import Form from 'soresu-form/web/form/Form'
import FormPreview from 'soresu-form/web/form/FormPreview'
import VaHakemusRegisterNumber from 'soresu-form/web/va/VaHakemusRegisterNumber'
import VaChangeRequest from 'soresu-form/web/va/VaChangeRequest'
import { mapAnswersWithMuutoshakemusData } from 'soresu-form/web/va/MuutoshakemusMapper'
import FormController from 'soresu-form/web/form/FormController'
import { BaseStateLoopState } from 'soresu-form/web/form/types/Form'

import VaFormTopbar from './VaFormTopbar'
import GrantRefuse from './GrantRefuse'
import OpenContactsEdit from './OpenContactsEdit'

import './style/main.less'
import { isJotpaAvustushaku } from './jotpa'
import { changeFaviconIconTo } from './favicon'

import { MuutoshakemusComponent } from './muutoshakemus/Muutoshakemus'
import {
  getTranslationContext,
  TranslationContext,
} from 'soresu-form/web/va/i18n/TranslationContext'

const allowedStatuses = ['officer_edit', 'submitted', 'pending_change_request', 'applicant_edit']

type VaFormProps<T extends BaseStateLoopState<T>> = {
  controller: FormController<T>
  state: T
  hakemusType: 'hakemus' | 'valiselvitys' | 'loppuselvitys'
  refuseGrant?: string
  modifyApplication?: string
  isExpired?: boolean
  useBusinessIdSearch?: boolean
  readOnly: boolean
}

export default function VaForm<T extends BaseStateLoopState<T>>(props: VaFormProps<T>) {
  const { controller, state, hakemusType, isExpired, refuseGrant, modifyApplication, readOnly } =
    props
  const { saveStatus, configuration } = state
  const { embedForMuutoshakemus } = configuration
  const translationContext = getTranslationContext(configuration.lang)

  const isJotpaHakemus =
    hakemusType === 'hakemus' && isJotpaAvustushaku(state.avustushaku?.['operational-unit-code'])
  const setCorrectFavicon = () => {
    if (isJotpaHakemus) {
      changeFaviconIconTo('jotpa')
    } else {
      changeFaviconIconTo('oph')
    }
  }

  useEffect(() => {
    setCorrectFavicon()
    return function cleanup() {
      changeFaviconIconTo('oph')
    }
  }, [isJotpaHakemus])

  const registerNumber = state.saveStatus.savedObject?.['register-number']
  const registerNumberDisplay = (
    <VaHakemusRegisterNumber
      key="register-number"
      registerNumber={registerNumber}
      translations={configuration.translations}
      lang={configuration.lang}
    />
  )
  const changeRequest = (
    <VaChangeRequest
      key="change-request"
      hakemus={saveStatus.savedObject}
      translations={configuration.translations}
      lang={configuration.lang}
    />
  )
  const headerElements = [registerNumberDisplay, changeRequest]
  const showGrantRefuse =
    readOnly &&
    // @ts-ignore
    state.token &&
    allowedStatuses.indexOf(saveStatus.savedObject?.status ?? '') > -1 &&
    refuseGrant === 'true'

  const isInApplicantEditMode = 'applicant_edit' === saveStatus.savedObject?.status
  const showOpenContactsEditButton = !showGrantRefuse && modifyApplication

  if (!embedForMuutoshakemus && readOnly) {
    saveStatus.values.value = mapAnswersWithMuutoshakemusData(
      // @ts-ignore
      state.avustushaku,
      saveStatus.values.value,
      // @ts-ignore
      state.muutoshakemukset,
      // @ts-ignore
      state.normalizedHakemus
    )
  }

  const showNewMuutos =
    (!embedForMuutoshakemus && !!modifyApplication && !showGrantRefuse) || isInApplicantEditMode

  const form = readOnly ? FormPreview : Form

  if (showNewMuutos && !!saveStatus.savedObject && state.avustushaku) {
    return (
      <div className={isJotpaHakemus ? 'jotpa-customizations' : ''}>
        <TranslationContext.Provider value={translationContext}>
          <MuutoshakemusComponent
            query={{
              lang: configuration.lang,
              'user-key': saveStatus.hakemusId,
              'avustushaku-id': state.avustushaku.id.toString(),
            }}
          />
        </TranslationContext.Provider>
      </div>
    )
  }

  return (
    <div className={isJotpaHakemus ? 'jotpa-customizations' : ''}>
      <>
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
            state={state}
            onSubmit={controller.refuseApplication}
            isTokenValid={state.tokenValidation ? state.tokenValidation.valid : false}
          />
        )}
        {!embedForMuutoshakemus && showOpenContactsEditButton && !showNewMuutos && (
          <OpenContactsEdit state={state} />
        )}

        <FormContainer
          controller={controller}
          state={state}
          form={form}
          headerElements={headerElements}
          infoElementValues={state.avustushaku}
          hakemusType={props.hakemusType}
          useBusinessIdSearch={props.useBusinessIdSearch}
          modifyApplication={modifyApplication}
        />
      </>
    </div>
  )
}
