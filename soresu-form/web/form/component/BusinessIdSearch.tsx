import React, { useCallback, useEffect, useRef, useState } from 'react'
import _ from 'lodash'

import FormUtil from '../FormUtil'
import LocalizedString from './LocalizedString'
import Translator from '../Translator'
import HttpUtil from '../../HttpUtil'
import SyntaxValidator from '../SyntaxValidator'

const organizationToFormFieldIds: Record<string, string> = {
  name: 'organization',
  email: 'organization-email',
  'organisation-id': 'business-id',
  contact: 'organization-postal-address',
}

const findFieldAnswerValue = (answers: Array<{ key: string; value: string }>, fieldId: string) => {
  const value = _.find(answers, (x) => x.key === fieldId)
  return value !== undefined ? value.value : undefined
}

const findBusinessIdRelatedFieldIdWithEmptyValue = (
  formContent: any,
  savedAnswers: Array<{ key: string; value: string }>
) =>
  _.find(
    _.values(organizationToFormFieldIds),
    (fieldId) =>
      FormUtil.findField(formContent, fieldId) &&
      _.isEmpty(findFieldAnswerValue(savedAnswers, fieldId))
  )

const shouldShowBusinessIdSearch = (state: any) =>
  !state.configuration.preview &&
  state.saveStatus.savedObject !== null &&
  findBusinessIdRelatedFieldIdWithEmptyValue(state.form.content, state.saveStatus.values.value)

const validateBusinessId = (str: string) =>
  SyntaxValidator.validateBusinessId(str) === undefined
    ? { isDisabled: false as const, error: '' as const }
    : { isDisabled: true as const, error: 'error' as const }

interface Props {
  state: any
  controller: any
}

export default function BusinessIdSearch({ state, controller }: Props) {
  const lang = state.configuration.lang
  const translations = state.configuration.translations.misc
  const translator = new Translator(state.configuration.translations.misc)
  const formContent = state.form.content
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(
    Boolean(shouldShowBusinessIdSearch(state))
  )
  const [{ isDisabled, error }, setValidity] = useState<{
    isDisabled: boolean
    error: '' | 'error'
  }>({ isDisabled: true, error: 'error' })
  const [incorrectBusinessId, setIncorrectBusinessId] = useState(false)
  const [otherErrorOnBusinessId, setOtherErrorOnBusinessId] = useState(false)
  const [businessId, setBusinessId] = useState('')

  const openModal = useCallback(() => setModalIsOpen(true), [])
  const closeModal = useCallback(() => setModalIsOpen(false), [])

  useEffect(() => {
    if (modalIsOpen) {
      document.body.style.overflow = 'hidden' // prevents background scrolling
      dialogRef.current?.showModal() // open the modal
    } else {
      document.body.style.overflow = '' // restore normal scrolling
      dialogRef.current?.close() // close the modal
    }
  }, [modalIsOpen])

  const changeFieldValue = (data: any, fieldId: string, organizationFieldName: string) => {
    const field = FormUtil.findField(formContent, fieldId)
    if (!field) return // nothing to change

    const fieldValue =
      organizationFieldName === 'contact'
        ? _.trim(
            `${data.contact?.address || ''} ${data.contact?.['postal-number'] || ''} ${
              data.contact?.city || ''
            }`
          )
        : data[organizationFieldName]

    if (!_.isEmpty(fieldValue)) {
      controller.componentOnChangeListener(field, fieldValue)
    }
  }

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    await fetchOrganizationData(businessId)
  }

  const handleOnChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const inputted = event.target.value
    setBusinessId(inputted)
    setValidity(validateBusinessId(inputted))
  }

  const fetchOrganizationData = async (id: string) => {
    const language = state.configuration.lang
    try {
      const response = await HttpUtil.get(
        `/api/organisations/?organisation-id=${id}&lang=${language}`
      )
      _.each(organizationToFormFieldIds, (formFieldId, organizationFieldName) => {
        if (!_.isEmpty((response as any)[organizationFieldName])) {
          changeFieldValue(response, formFieldId, organizationFieldName)
        }
      })
      setIncorrectBusinessId(false)
      setOtherErrorOnBusinessId(false)
      closeModal()
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setIncorrectBusinessId(true)
        setOtherErrorOnBusinessId(false)
        openModal()
      } else {
        setOtherErrorOnBusinessId(true)
        setIncorrectBusinessId(false)
        openModal()
      }
    }
  }

  return (
    <div>
      <dialog ref={dialogRef} className="modal">
        <div>
          <h1>
            <LocalizedString
              translations={translations}
              translationKey="give-businessid"
              lang={lang}
            />
          </h1>
          <p>
            <LocalizedString
              translations={translations}
              translationKey="organisation-info"
              lang={lang}
            />
          </p>
          <p id="not-found-business-id">
            {incorrectBusinessId && (
              <LocalizedString
                translations={translations}
                translationKey="not-found-business-id"
                lang={lang}
              />
            )}
          </p>
          <p id="other-error-business-id">
            {otherErrorOnBusinessId && (
              <LocalizedString
                translations={translations}
                translationKey="error-with-business-id"
                lang={lang}
              />
            )}
          </p>
          <form onSubmit={handleOnSubmit}>
            <label className="modal-label">
              <LocalizedString
                translations={translations}
                translationKey="business-id"
                lang={lang}
              />
              :
              <input
                id="finnish-business-id"
                className={error}
                type="text"
                value={businessId}
                onChange={handleOnChange}
                autoFocus
              />
            </label>
            <input
              className={'get-business-id' + ' ' + 'soresu-text-button'}
              type="submit"
              value={translator.translate('get', lang)}
              disabled={isDisabled}
            />
          </form>
          <p>
            <a role="button" onClick={closeModal}>
              <LocalizedString translations={translations} translationKey="cancel" lang={lang} />
            </a>
          </p>
        </div>
      </dialog>
    </div>
  )
}
