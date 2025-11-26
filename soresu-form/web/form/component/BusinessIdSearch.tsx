import React, { useState } from 'react'
import _ from 'lodash'

import ModalDialog from './ModalDialog'
import FormUtil from '../FormUtil'
import LocalizedString from './LocalizedString'
import Translator from '../Translator'
import HttpUtil from '../../HttpUtil'
import SyntaxValidator from '../SyntaxValidator'
import { Field } from 'soresu-form/web/va/types'
import { BaseStateLoopState } from 'soresu-form/web/form/types/Form'

interface OrganizationContact {
  address?: string
  'postal-number'?: string
  city?: string
}

interface OrganizationResponse {
  name: string
  email: string
  'organisation-id': string
  contact: OrganizationContact
  county: string | null
}

type OrganizationFieldName = keyof typeof organizationToFormFieldIds

const organizationToFormFieldIds = {
  name: 'organization',
  email: 'organization-email',
  'organisation-id': 'business-id',
  contact: 'organization-postal-address',
} as const

interface FormController {
  componentOnChangeListener: (field: Field, value: string) => void
}

interface BusinessIdSearchProps {
  state: BaseStateLoopState<BaseStateLoopState<unknown>>
  controller: FormController
}

interface ValidationResult {
  isDisabled: boolean
  error: string
}

const findFieldAnswerValue = (answers: Array<{ key: string; value: string }>, fieldId: string) => {
  const value = _.find(answers, (x) => x.key === fieldId)
  return value !== undefined ? value.value : undefined
}

const findBusinessIdRelatedFieldIdWithEmptyValue = (
  formContent: Field[],
  savedAnswers: Array<{ key: string; value: string }>
) =>
  _.find(
    _.values(organizationToFormFieldIds),
    (fieldId) =>
      FormUtil.findField(formContent, fieldId) &&
      _.isEmpty(findFieldAnswerValue(savedAnswers, fieldId))
  )

const shouldShowBusinessIdSearch = (
  state: BaseStateLoopState<BaseStateLoopState<unknown>>
): boolean =>
  !state.configuration.preview &&
  state.saveStatus.savedObject !== null &&
  !!findBusinessIdRelatedFieldIdWithEmptyValue(state.form.content, state.saveStatus.values.value)

const validateBusinessId = (str: string): ValidationResult =>
  SyntaxValidator.validateBusinessId(str) === undefined
    ? { isDisabled: false, error: '' }
    : { isDisabled: true, error: 'error' }

export default function BusinessIdSearch({ state, controller }: BusinessIdSearchProps) {
  const [modalIsOpen, setModalIsOpen] = useState(shouldShowBusinessIdSearch(state))
  const [isDisabled, setIsDisabled] = useState(true)
  const [error, setError] = useState('error')
  const [incorrectBusinessId, setIncorrectBusinessId] = useState(false)
  const [otherErrorOnBusinessId, setOtherErrorOnBusinessId] = useState(false)
  const [businessId, setBusinessId] = useState('')

  const lang = state.configuration.lang
  const translations = state.configuration.translations.misc
  const translator = new Translator(state.configuration.translations.misc)
  const formContent = state.form.content

  function openModal() {
    setModalIsOpen(true)
  }

  function closeModal() {
    setModalIsOpen(false)
  }

  function changeFieldValue(
    data: OrganizationResponse,
    fieldId: string,
    organizationFieldName: string
  ) {
    const field = FormUtil.findField(formContent, fieldId)

    if (!field) {
      return // nothing to change
    }

    const fieldValue =
      organizationFieldName === 'contact'
        ? _.trim(
            `${data.contact.address || ''} ${data.contact['postal-number'] || ''} ${
              data.contact.city || ''
            }`
          )
        : data[organizationFieldName as keyof OrganizationResponse]

    if (!_.isEmpty(fieldValue)) {
      controller.componentOnChangeListener(field, String(fieldValue))
    }
  }

  // actions that happen after user has submitted their organisation-id, calls backend organisaton api
  function fetchOrganizationData(id: string) {
    const language = state.configuration.lang
    HttpUtil.get<OrganizationResponse>(`/api/organisations/?organisation-id=${id}&lang=${language}`)
      .then((response) => {
        _.each(organizationToFormFieldIds, (formFieldId, organizationFieldName) => {
          if (!_.isEmpty(response[organizationFieldName as OrganizationFieldName])) {
            changeFieldValue(response, formFieldId, organizationFieldName)
          }
        })
      })
      .catch((error: { response: { status: number } }) => {
        if (error.response.status === 404) {
          setIncorrectBusinessId(true)
          openModal()
        } else {
          setOtherErrorOnBusinessId(true)
          setIncorrectBusinessId(false)
          openModal()
        }
      })
  }

  // events from inputting the organisational id (y-tunnus)
  function handleOnSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    fetchOrganizationData(businessId)
    setModalIsOpen(false)
  }

  function handleOnChange(event: React.ChangeEvent<HTMLInputElement>) {
    const inputted = event.target.value
    const validation = validateBusinessId(inputted)
    setBusinessId(inputted)
    setIsDisabled(validation.isDisabled)
    setError(validation.error)
  }

  return (
    <div>
      <ModalDialog isOpen={modalIsOpen} className="modal" overlayClassName="overlay">
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
            <a onClick={closeModal}>
              <LocalizedString translations={translations} translationKey="cancel" lang={lang} />
            </a>
          </p>
        </div>
      </ModalDialog>
    </div>
  )
}
