import React, { useEffect, useRef, useState } from 'react'

import FormContainer from 'soresu-form/web/form/FormContainer'
import Form from 'soresu-form/web/form/Form'
import FormPreview from 'soresu-form/web/form/FormPreview'
import VaHakemusRegisterNumber from 'soresu-form/web/va/VaHakemusRegisterNumber'
import VaChangeRequest from 'soresu-form/web/va/VaChangeRequest'
import { mapAnswersWithMuutoshakemusData } from 'soresu-form/web/va/MuutoshakemusMapper'
import FormController from 'soresu-form/web/form/FormController'
import { BaseStateLoopState, HakijaAvustusHaku, SavedObject } from 'soresu-form/web/form/types/Form'

import VaFormTopbar from './VaFormTopbar'
import GrantRefuse from './GrantRefuse'
import OpenContactsEdit from './OpenContactsEdit'

import './style/main.less'
import { isJotpaAvustushaku } from './jotpa'
import { changeFaviconIconTo } from './favicon'

import { ErrorMessage } from './muutoshakemus/ErrorMessage'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import HttpUtil from 'soresu-form/web/HttpUtil'
import { Answer } from 'soresu-form/web/va/types'
import { translations } from 'soresu-form/web/va/i18n/translations'
import { Logo } from './Logo'
import CurrentHakemusIframe from './muutoshakemus/CurrentHakemuksIframe'

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
  const currentHakemusIframeRef = useRef<HTMLIFrameElement | null>(null)
  const isJotpaHakemus = hakemusType === 'hakemus' && isJotpaAvustushaku(state.avustushaku)

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

  const form = readOnly || showNewMuutos ? FormPreview : Form

  if (showNewMuutos && !!saveStatus.savedObject && state.avustushaku) {
    return (
      <div className={isJotpaHakemus ? 'jotpa-customizations' : ''}>
        <HenkilotietoForm
          hakemus={saveStatus.savedObject}
          avustushaku={state.avustushaku}
          userKey={saveStatus.hakemusId}
          lang={configuration.lang}
          isInApplicantEditMode={isInApplicantEditMode}
          showJotpaLogo={isJotpaHakemus}
          currentHakemusIframeRef={currentHakemusIframeRef}
        />
        <CurrentHakemusIframe
          avustushakuId={state.avustushaku.id}
          userKey={saveStatus.hakemusId}
          currentHakemusIframeRef={currentHakemusIframeRef}
        />
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

function HenkilotietoForm({
  hakemus,
  avustushaku,
  userKey,
  lang,
  isInApplicantEditMode,
  showJotpaLogo,
  currentHakemusIframeRef,
}: {
  hakemus: SavedObject
  avustushaku: HakijaAvustusHaku
  userKey: string
  lang: 'fi' | 'sv'
  isInApplicantEditMode: boolean
  showJotpaLogo: boolean
  currentHakemusIframeRef?: React.RefObject<HTMLIFrameElement | null>
}) {
  const [saveSuccess, setSaveSuccess] = useState(false)
  const t = translations[lang]
  const e = t.formErrors

  const validationSchema = Yup.object({
    'applicant-name': Yup.string().required(e.required),
    'primary-email': Yup.string().email(e.email).required(e.required),
    'textField-0': Yup.string().required(e.required),
    'trusted-contact-name': Yup.string().notRequired(),
    'trusted-contact-email': Yup.string().email(e.email).notRequired(),
    'trusted-contact-phone': Yup.string().notRequired(),
  })
  type FormValues = Yup.InferType<typeof validationSchema>

  const findAnswerValue = (key: string): string => {
    const answer = hakemus.submission.answers.value.find((a) => a.key === key)
    return answer?.value || ''
  }

  const updateAnswerValue = (answers: Answer[], key: string, newValue: string): Answer[] => {
    return answers.map((answer) => (answer.key === key ? { ...answer, value: newValue } : answer))
  }

  const hasAnswerField = (key: string): boolean => {
    return hakemus.submission.answers.value.some((a) => a.key === key)
  }

  const onSubmit = async (values: FormValues) => {
    setSaveSuccess(false)
    try {
      const setEditableUrl = `/api/avustushaku/${avustushaku.id}/hakemus/${userKey}/applicant-edit-open`

      const newHakemusVersion = isInApplicantEditMode
        ? hakemus.version
        : await HttpUtil.post(setEditableUrl)
      let updatedAnswers = [...hakemus.submission.answers.value]

      updatedAnswers = updateAnswerValue(updatedAnswers, 'applicant-name', values['applicant-name'])
      updatedAnswers = updateAnswerValue(updatedAnswers, 'primary-email', values['primary-email'])
      updatedAnswers = updateAnswerValue(updatedAnswers, 'textField-0', values['textField-0'])
      if (!!values['trusted-contact-name']) {
        updatedAnswers = updateAnswerValue(
          updatedAnswers,
          'trusted-contact-name',
          values['trusted-contact-name']
        )
      }
      if (!!values['trusted-contact-email']) {
        updatedAnswers = updateAnswerValue(
          updatedAnswers,
          'trusted-contact-email',
          values['trusted-contact-email']
        )
      }
      if (!!values['trusted-contact-phone']) {
        updatedAnswers = updateAnswerValue(
          updatedAnswers,
          'trusted-contact-phone',
          values['trusted-contact-phone']
        )
      }

      const answersPayload = {
        value: updatedAnswers,
      }

      const url = `/api/avustushaku/${avustushaku.id}/hakemus/${userKey}/${newHakemusVersion}/applicant-edit-submit`
      await HttpUtil.post(url, answersPayload)

      setSaveSuccess(true)

      if (currentHakemusIframeRef?.current) {
        currentHakemusIframeRef.current.src = currentHakemusIframeRef.current.src
        f.resetForm({ values: f.values })
      }

      // Reload the page after successful save to show updated data
    } catch (error) {
      if (currentHakemusIframeRef?.current) {
        currentHakemusIframeRef.current.src = currentHakemusIframeRef.current.src
        f.resetForm({ values: f.values })
      }
      console.error('Error saving contact details:', error)
    }
  }

  const f = useFormik({
    initialValues: {
      'applicant-name': findAnswerValue('applicant-name'),
      'primary-email': findAnswerValue('primary-email'),
      'textField-0': findAnswerValue('textField-0'),
      'trusted-contact-name': findAnswerValue('trusted-contact-name'),
      'trusted-contact-email': findAnswerValue('trusted-contact-email'),
      'trusted-contact-phone': findAnswerValue('trusted-contact-phone'),
    },
    validationSchema,
    onSubmit: onSubmit,
  })

  const getEmailInputClass = (emailFieldName: 'primary-email' | 'trusted-contact-email') => {
    if (f.touched[emailFieldName] && f.errors[emailFieldName]) {
      return 'muutoshakemus__input muutoshakemus__input-error muutoshakemus__input--contact'
    }
    return 'muutoshakemus__input muutoshakemus__input--contact'
  }

  return (
    <form className="muutoshakemus__form" onSubmit={f.handleSubmit}>
      <section id="topbar">
        <div id="top-container">
          <Logo showJotpaLogo={showJotpaLogo} lang={lang} />
          <div className="topbar-right">
            <div className="muutospyynto-button-container">
              <button
                disabled={f.isSubmitting || !f.isValid || !f.dirty}
                id="send-muutospyynto-button"
                type="submit"
              >
                {t.sendContactDetails}
              </button>
              {saveSuccess && (
                <div className="muutoshakemus__save-success" data-test-id="save-success-message">
                  {t.savedNotification}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="muutoshakemus__section muutoshakemus__top-form">
        <div className="muutoshakemus__section-content">
          <div className="muutoshakemus__form">
            <h1 className="muutoshakemus__title">
              {t.contactPersonEdit.haku}: {avustushaku.content.name[lang]}
            </h1>
            <div className="muutoshakemus__form-row">
              <div className="muutoshakemus__form-cell">
                <div className="muutoshakemus__hanke-name__title">{t.contactPersonEdit.hanke}</div>
                <div className="muutoshakemus__hanke-name__name" data-test-id="project-name">
                  {findAnswerValue('project-name')}
                </div>
              </div>
            </div>
            <div className="muutoshakemus__form-row">
              <div className="muutoshakemus__form-cell">
                <div
                  className="muutoshakemus__hanke-name__title"
                  data-test-id="register-number-title"
                >
                  {t.contactPersonEdit.registerNumberTitle}
                </div>
                <div className="muutoshakemus__hanke-name__name" data-test-id="register-number">
                  {hakemus['register-number']}
                </div>
              </div>
            </div>
            <div className="muutoshakemus__form-row">
              {/* yhteystiedot */}
              <div className="muutoshakemus__form-cell">
                <label className="muutoshakemus__label" htmlFor="contact-person">
                  {t.contactPersonEdit.contactPerson}
                </label>
                <input
                  id="contact-person"
                  className="muutoshakemus__input muutoshakemus__input--contact"
                  name="applicant-name"
                  type="text"
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  value={f.values['applicant-name']}
                />
              </div>
              <div className="muutoshakemus__form-cell">
                <label className="muutoshakemus__label" htmlFor="contact-email">
                  {t.contactPersonEdit.email}
                </label>
                <input
                  id="contact-email"
                  name="primary-email"
                  type="text"
                  className={getEmailInputClass('primary-email')}
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  value={f.values['primary-email']}
                />
                <ErrorMessage
                  text={
                    typeof f.errors['primary-email'] === 'string'
                      ? f.errors['primary-email']
                      : undefined
                  }
                />
              </div>
              <div className="muutoshakemus__form-cell">
                <label className="muutoshakemus__label" htmlFor="contact-phone">
                  {t.contactPersonEdit.phone}
                </label>
                <input
                  id="contact-phone"
                  className="muutoshakemus__input muutoshakemus__input--contact"
                  name="textField-0"
                  type="text"
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  value={f.values['textField-0']}
                />
              </div>
            </div>
            {/* trusted contact information */}
            <div className="muutoshakemus__form-row">
              {hasAnswerField('trusted-contact-name') && (
                <div className="muutoshakemus__form-cell">
                  <label className="muutoshakemus__label" htmlFor="trustedcontactname">
                    {t.contactPersonEdit.contactPerson}
                  </label>
                  <input
                    id="trustedcontactname"
                    className="muutoshakemus__input muutoshakemus__input--contact"
                    name="trusted-contact-name"
                    type="text"
                    onChange={f.handleChange}
                    onBlur={f.handleBlur}
                    value={f.values['trusted-contact-name']}
                  />
                </div>
              )}
              {hasAnswerField('trusted-contact-email') && (
                <div className="muutoshakemus__form-cell">
                  <label className="muutoshakemus__label" htmlFor="trusted-contact-email">
                    {t.contactPersonEdit.email}
                  </label>
                  <input
                    id="trusted-contact-email"
                    name="trusted-contact-email"
                    type="text"
                    className={getEmailInputClass('trusted-contact-email')}
                    onChange={f.handleChange}
                    onBlur={f.handleBlur}
                    value={f.values['trusted-contact-email']}
                  />
                  <ErrorMessage
                    text={
                      typeof f.errors['trusted-contact-email'] === 'string'
                        ? f.errors['trusted-contact-email']
                        : undefined
                    }
                  />
                </div>
              )}
              {hasAnswerField('trusted-contact-phone') && (
                <div className="muutoshakemus__form-cell">
                  <label className="muutoshakemus__label" htmlFor="trusted-contact-phone">
                    {t.contactPersonEdit.phone}
                  </label>
                  <input
                    id="trusted-contact-phone"
                    className="muutoshakemus__input muutoshakemus__input--contact"
                    name="trusted-contact-phone"
                    type="text"
                    onChange={f.handleChange}
                    onBlur={f.handleBlur}
                    value={f.values['trusted-contact-phone']}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </form>
  )
}
