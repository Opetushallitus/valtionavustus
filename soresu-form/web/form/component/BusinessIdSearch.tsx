import React, { useState } from 'react'
import _ from 'lodash'

import ModalDialog from './ModalDialog'
import FormUtil from '../FormUtil'
import LocalizedString from './LocalizedString'
import Translator from '../Translator'
import SyntaxValidator from '../SyntaxValidator'
import { Field, Language, LegacyTranslationDict } from 'soresu-form/web/va/types'
import { BaseStateLoopState } from 'soresu-form/web/form/types/Form'
import HttpUtil from 'soresu-form/web/HttpUtil'

import './BusinessIdSearch.less'

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
  const [finnishOrganization, setFinnishOrganization] = useState<OrganizationResponse | null>(null)
  const [swedishOrganization, setSwedishOrganization] = useState<OrganizationResponse | null>(null)
  const [selectedOrganisation, setSelectedOrganisation] = useState<OrganizationResponse | null>(null)

  const lang = state.configuration.lang
  const translations = state.configuration.translations.misc
  const translator = new Translator(state.configuration.translations.misc)
  const formContent = state.form.content

  function closeModal() {
    setModalIsOpen(false)
    setFinnishOrganization(null)
    setSwedishOrganization(null)
    setBusinessId('')
    setIncorrectBusinessId(false)
    setOtherErrorOnBusinessId(false)
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

  function fillFormFields(data: OrganizationResponse) {
    _.each(organizationToFormFieldIds, (formFieldId, organizationFieldName) => {
      if (!_.isEmpty(data[organizationFieldName as OrganizationFieldName])) {
        changeFieldValue(data, formFieldId, organizationFieldName)
      }
    })
  }

  // actions that happen after user has submitted their organisation-id, calls backend organisaton api
  function fetchOrganizationData(id: string) {
    HttpUtil.get<OrganizationResponse>(`/api/organisations/?organisation-id=${id}&lang=fi`)
      .then((response) => {
        setFinnishOrganization(response)
        setIncorrectBusinessId(false)
        setOtherErrorOnBusinessId(false)
      })
      .catch((error: { response: { status: number } }) => {
        if (error.response.status === 404) {
          setIncorrectBusinessId(true)
        } else {
          setOtherErrorOnBusinessId(true)
          setIncorrectBusinessId(false)
        }
      })

    HttpUtil.get<OrganizationResponse>(`/api/organisations/?organisation-id=${id}&lang=sv`)
      .then((response) => {
        setSwedishOrganization(response)
        setIncorrectBusinessId(false)
        setOtherErrorOnBusinessId(false)
      })
      .catch((error: { response: { status: number } }) => {
        if (error.response.status === 404) {
          setIncorrectBusinessId(true)
        } else {
          setOtherErrorOnBusinessId(true)
          setIncorrectBusinessId(false)
        }
      })
  }

  // events from inputting the organisational id (y-tunnus)
  function handleOnSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    fetchOrganizationData(businessId)
  }

  function handleOnChange(event: React.ChangeEvent<HTMLInputElement>) {
    const inputted = event.target.value
    const validation = validateBusinessId(inputted)
    setBusinessId(inputted)
    setIsDisabled(validation.isDisabled)
    setError(validation.error)
  }

  function handleConfirm() {
    if (selectedOrganisation) {
      fillFormFields(selectedOrganisation)
      closeModal()
    }
  }

  return (
    <div>
      <ModalDialog isOpen={modalIsOpen} className="business-id-search-modal" overlayClassName="overlay">
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
            <label className="business-id-search-modal-label">
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

          {(finnishOrganization || swedishOrganization) &&
          <p>
            <LocalizedString
              translations={translations}
              translationKey="confirm-business-id-info"
              lang={lang}
            />
          </p>
          }
          <div className="language-divider-wrapper">
            <div className="language-divider">
            {finnishOrganization &&
              <Selection translations={translations} lang={lang} organisation={finnishOrganization} setSelectedOrganisation={setSelectedOrganisation} selectedOrganisation={selectedOrganisation} />
            }
            {swedishOrganization &&
              <Selection translations={translations} lang={lang} organisation={swedishOrganization} setSelectedOrganisation={setSelectedOrganisation} selectedOrganisation={selectedOrganisation} />
            }
            </div>
            {(finnishOrganization || swedishOrganization) &&
              <button
                className="confirm-selection-button soresu-text-button"
                data-test-id="confirm-selection"
                onClick={handleConfirm}
                disabled={!selectedOrganisation}
                type="button"
              >
                <LocalizedString translations={translations} translationKey="confirm" lang={lang} />
                </button>
            }
          </div>

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

type ConfirmationProps = {
  translations: LegacyTranslationDict
  lang: Language
  selectedOrganisation: OrganizationResponse|null
  organisation: OrganizationResponse
  setSelectedOrganisation: (organisation: OrganizationResponse|null) => void
}

function Selection ({translations, lang, selectedOrganisation, organisation, setSelectedOrganisation}: ConfirmationProps) {

  const isSelected = selectedOrganisation && selectedOrganisation.name === organisation.name && selectedOrganisation?.email === organisation.email && selectedOrganisation?.['organisation-id'] === organisation['organisation-id']

  return (
            <button className={`organisation-selection${isSelected ? " selected" : ""}`} data-test-id={`organisation-selection-${lang}`} onClick={() => setSelectedOrganisation(organisation)}>
              <div className="selection-field">
                <span className="selection-field-label">
                  <strong>
                    <LocalizedString
                      translations={translations}
                      translationKey="hakija"
                      lang={lang}
                    />
                    :
                  </strong>
                </span>
                <span className="selection-field-value">
                  {organisation.name}
                </span>
              </div>
              <div className="selection-field">
                <span className="selection-field-label">
                  <strong>
                    <LocalizedString
                      translations={translations}
                      translationKey="organization-email"
                      lang={lang}
                    />
                    :
                  </strong>
                </span>
                <span className="selection-field-value">
                  {organisation.email}
                </span>
              </div>
              <div className="selection-field">
                <span className="selection-field-label">
                  <strong>
                    <LocalizedString
                      translations={translations}
                      translationKey="business-id"
                      lang={lang}
                    />
                    :
                  </strong>
                </span>
                <span className="selection-field-value">
                  {organisation['organisation-id']}
                </span>
              </div>
            </button>
  )
}
