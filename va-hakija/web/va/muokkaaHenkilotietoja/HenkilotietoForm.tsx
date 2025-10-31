import { useFormik } from 'formik'
import React, { useRef, useState } from 'react'
import { SavedObject, HakijaAvustusHaku } from 'soresu-form/web/form/types/Form'
import HttpUtil from 'soresu-form/web/HttpUtil'
import { translations } from 'soresu-form/web/va/i18n/translations'
import { Answer } from 'soresu-form/web/va/types'
import * as Yup from 'yup'
import { Logo } from '../Logo'
import CurrentHakemusIframe from '../muutoshakemus/CurrentHakemuksIframe'
import { ErrorMessage } from '../muutoshakemus/ErrorMessage'
import * as styles from './henkilotietoForm.module.less'

const findAnswerValue = (answers: Answer[], key: string): string => {
  const answer = answers.find((a) => a.key === key)
  return answer?.value || ''
}

const updateAnswerValue = (answers: Answer[], key: string, newValue: string): Answer[] => {
  return answers.map((answer) => (answer.key === key ? { ...answer, value: newValue } : answer))
}

const hasAnswerField = (answers: Answer[], key: string): boolean => {
  return answers.some((a) => a.key === key)
}

export function HenkilotietoForm({
  hakemus,
  avustushaku,
  userKey,
  lang,
  isInApplicantEditMode,
  showJotpaLogo,
}: {
  hakemus: SavedObject
  avustushaku: HakijaAvustusHaku
  userKey: string
  lang: 'fi' | 'sv'
  isInApplicantEditMode: boolean
  showJotpaLogo: boolean
}) {
  const answers = hakemus.submission.answers.value
  const currentHakemusIframeRef = useRef<HTMLIFrameElement | null>(null)
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | undefined>(undefined)

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

  const onSubmit = async (values: FormValues) => {
    setSaveStatus(undefined)
    try {
      const setEditableUrl = `/api/avustushaku/${avustushaku.id}/hakemus/${userKey}/applicant-edit-open`

      const newHakemusVersion = isInApplicantEditMode
        ? hakemus.version
        : await HttpUtil.post(setEditableUrl)
      let updatedAnswers = [...answers]

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

      setSaveStatus('success')
      if (currentHakemusIframeRef?.current) {
        currentHakemusIframeRef.current.src = currentHakemusIframeRef.current.src
        f.resetForm({ values: f.values })
      }
    } catch (error) {
      setSaveStatus('error')
    }
  }

  const f = useFormik({
    initialValues: {
      'applicant-name': findAnswerValue(answers, 'applicant-name'),
      'primary-email': findAnswerValue(answers, 'primary-email'),
      'textField-0': findAnswerValue(answers, 'textField-0'),
      'trusted-contact-name': findAnswerValue(answers, 'trusted-contact-name'),
      'trusted-contact-email': findAnswerValue(answers, 'trusted-contact-email'),
      'trusted-contact-phone': findAnswerValue(answers, 'trusted-contact-phone'),
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
  const notification =
    saveStatus === 'success'
      ? { text: t.savedNotification, type: 'success' as const }
      : { text: t.errorNotification, type: 'error' as const }

  return (
    <>
      <form className="muutoshakemus__form" onSubmit={f.handleSubmit}>
        <TopBar
          title={t.hakemus}
          buttonText={t.sendContactDetails}
          showJotpaLogo={showJotpaLogo}
          lang={lang}
          disabled={f.isSubmitting || !f.isValid || !f.dirty}
          notification={saveStatus ? notification : undefined}
        />

        <section className="muutoshakemus__section muutoshakemus__top-form">
          <div className="muutoshakemus__section-content">
            <div className="muutoshakemus__form">
              <h1 className="muutoshakemus__title">
                {t.contactPersonEdit.haku}: {avustushaku.content.name[lang]}
              </h1>
              <div className="muutoshakemus__form-row">
                <div className="muutoshakemus__form-cell">
                  <div className="muutoshakemus__hanke-name__title">
                    {t.contactPersonEdit.hanke}
                  </div>
                  <div className="muutoshakemus__hanke-name__name" data-test-id="project-name">
                    {findAnswerValue(answers, 'project-name')}
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
                {hasAnswerField(answers, 'trusted-contact-name') && (
                  <div className="muutoshakemus__form-cell">
                    <label className="muutoshakemus__label" htmlFor="trustedcontactname">
                      {t.contactPersonEdit.trustedContactName}
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
                {hasAnswerField(answers, 'trusted-contact-email') && (
                  <div className="muutoshakemus__form-cell">
                    <label className="muutoshakemus__label" htmlFor="trusted-contact-email">
                      {t.contactPersonEdit.trustedContactEmail}
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
                {hasAnswerField(answers, 'trusted-contact-phone') && (
                  <div className="muutoshakemus__form-cell">
                    <label className="muutoshakemus__label" htmlFor="trusted-contact-phone">
                      {t.contactPersonEdit.trustedContactPhone}
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
      <CurrentHakemusIframe
        avustushakuId={avustushaku.id}
        userKey={userKey}
        currentHakemusIframeRef={currentHakemusIframeRef}
      />
    </>
  )
}
function TopBar({
  title,
  buttonText,
  notification,
  showJotpaLogo,
  lang,
  disabled,
}: {
  title: string
  buttonText: string
  notification:
    | {
        text: string
        type: 'success' | 'error'
      }
    | undefined
  showJotpaLogo: boolean
  lang: 'fi' | 'sv'
  disabled: boolean
}) {
  return (
    <section id="topbar">
      <div id="top-container" className={styles.topBar}>
        <Logo showJotpaLogo={showJotpaLogo} lang={lang} />
        <div className="topbar-right">
          <div className="topbar-title-and-save-status">
            <h1 id="topic">{title}</h1>
          </div>
        </div>
        <div className="muutospyynto-button-container">
          <button disabled={disabled} id="send-muutospyynto-button" type="submit">
            {buttonText}
          </button>
          {notification !== undefined && (
            <div
              className={notification.type === 'success' ? styles.saveSuccess : styles.saveError}
              data-test-id="save-success-message"
            >
              {notification.text}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
