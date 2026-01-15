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

import './OrganisationSelection.less'

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

interface SelectedOrganisation extends OrganizationResponse {
  lang: Language
}

interface OrganisationSelectionProps {
  state: BaseStateLoopState<BaseStateLoopState<unknown>>
  controller: FormController
}

export function OrganisationSelection({ state, controller }: OrganisationSelectionProps) {
  const [modalIsOpen, setModalIsOpen] = useState(shouldOpenModal(state))
  const [selectedOrganisation, setSelectedOrganisation] = useState<SelectedOrganisation | null>(
    null
  )
  const [finnishOrganization, setFinnishOrganization] = useState<OrganizationResponse | null>(null)
  const [swedishOrganization, setSwedishOrganization] = useState<OrganizationResponse | null>(null)

  const lang = state.configuration.lang
  const translations = state.configuration.translations.misc
  const translator = new Translator(state.configuration.translations.misc)
  const formContent = state.form.content

  const handleConfirm = () => {
    if (selectedOrganisation) {
      fillFormFields(selectedOrganisation)
      setModalIsOpen(false)
    }
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

  return (
    <div>
      <ModalDialog isOpen={modalIsOpen} className="organisation-modal" overlayClassName="overlay">
        <BusinessIdSearch
          translator={translator}
          lang={lang}
          translations={translations}
          setFinnishOrganization={setFinnishOrganization}
          setSwedishOrganization={setSwedishOrganization}
          setSelectedOrganisation={setSelectedOrganisation}
        />
        {(finnishOrganization || swedishOrganization) && (
          <Selector
            translations={translations}
            lang={lang}
            finnishOrganization={finnishOrganization}
            swedishOrganization={swedishOrganization}
            setSelectedOrganisation={setSelectedOrganisation}
            handleConfirm={handleConfirm}
            selectedOrganisation={selectedOrganisation}
          />
        )}
      </ModalDialog>
    </div>
  )
}

interface BusinessIdSearchProps {
  translator: Translator
  translations: LegacyTranslationDict
  lang: Language
  setFinnishOrganization: (org: OrganizationResponse | null) => void
  setSwedishOrganization: (org: OrganizationResponse | null) => void
  setSelectedOrganisation: (organisation: SelectedOrganisation | null) => void
}

function BusinessIdSearch({
  translator,
  translations,
  lang,
  setFinnishOrganization,
  setSwedishOrganization,
  setSelectedOrganisation,
}: BusinessIdSearchProps) {
  const [isDisabled, setIsDisabled] = useState(true)
  const [error, setError] = useState('error')
  const [incorrectBusinessId, setIncorrectBusinessId] = useState(false)
  const [otherErrorOnBusinessId, setOtherErrorOnBusinessId] = useState(false)
  const [businessId, setBusinessId] = useState('')

  // actions that happen after user has submitted their organisation-id, calls backend organisaton api
  const fetchOrganizationData = (id: string) => {
    setSelectedOrganisation(null)
    HttpUtil.get<OrganizationResponse>(`/api/organisations/?organisation-id=${id}&lang=fi`)
      .then((response) => {
        setFinnishOrganization(response)
        setIncorrectBusinessId(false)
        setOtherErrorOnBusinessId(false)
      })
      .catch((error: { response: { status: number } }) => {
        setFinnishOrganization(null)
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
        setSwedishOrganization(null)
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

  return (
    <div className="business-id-search">
      <h1>
        <LocalizedString translations={translations} translationKey="give-businessid" lang={lang} />
      </h1>
      <br />

      {incorrectBusinessId && (
        <p id="not-found-business-id">
          <LocalizedString
            translations={translations}
            translationKey="not-found-business-id"
            lang={lang}
          />
        </p>
      )}
      {otherErrorOnBusinessId && (
        <p id="other-error-business-id">
          <LocalizedString
            translations={translations}
            translationKey="error-with-business-id"
            lang={lang}
          />
        </p>
      )}

      <form onSubmit={handleOnSubmit}>
        <label className="organisation-modal-label">
          <LocalizedString translations={translations} translationKey="business-id" lang={lang} />
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
          className="get-business-id"
          type="submit"
          value={translator.translate('get', lang)}
          disabled={isDisabled}
        />
      </form>
      <div className="organisation-selection-info">
        <LocalizedString
          translations={translations}
          translationKey="organisation-selection-info-1"
          lang={lang}
        />
        <LocalizedString
          translations={translations}
          translationKey="organisation-selection-info-2"
          lang={lang}
        />
        <span>
          <LocalizedString
            translations={translations}
            translationKey="organisation-selection-info-3-before-email"
            lang={lang}
          />
          <a href="mailto:yhteisetpalvelut@oph.fi">yhteisetpalvelut@oph.fi</a>
          <LocalizedString
            translations={translations}
            translationKey="organisation-selection-info-3-after-email"
            lang={lang}
          />
        </span>
      </div>
    </div>
  )
}

type SelectorProps = {
  translations: LegacyTranslationDict
  lang: Language
  finnishOrganization: OrganizationResponse | null
  swedishOrganization: OrganizationResponse | null
  setSelectedOrganisation: (organisation: SelectedOrganisation | null) => void
  selectedOrganisation: SelectedOrganisation | null
  handleConfirm: () => void
}

function Selector({
  translations,
  lang,
  finnishOrganization,
  swedishOrganization,
  setSelectedOrganisation,
  selectedOrganisation,
  handleConfirm,
}: SelectorProps) {
  const organisationInformationIsSameForBothLang =
    finnishOrganization &&
    swedishOrganization &&
    finnishOrganization.name === swedishOrganization.name &&
    finnishOrganization.email === swedishOrganization.email &&
    finnishOrganization['organisation-id'] === swedishOrganization['organisation-id'] &&
    finnishOrganization.contact &&
    swedishOrganization.contact &&
    finnishOrganization.contact.city === swedishOrganization.contact.city &&
    finnishOrganization.contact.address === swedishOrganization.contact.address &&
    finnishOrganization.contact['postal-number'] === swedishOrganization.contact['postal-number']

  return (
    <div className="selector-wrapper">
      <LocalizedString
        translations={translations}
        translationKey="confirm-business-id-info"
        lang={lang}
      />
      <div className="selector">
        {finnishOrganization && (
          <Selection
            translations={translations}
            lang={lang}
            organisation={finnishOrganization}
            setSelectedOrganisation={setSelectedOrganisation}
            selectedOrganisation={selectedOrganisation}
            organisationLang="fi"
          />
        )}
        {swedishOrganization && !organisationInformationIsSameForBothLang && (
          <Selection
            translations={translations}
            lang={lang}
            organisation={swedishOrganization}
            setSelectedOrganisation={setSelectedOrganisation}
            selectedOrganisation={selectedOrganisation}
            organisationLang="sv"
          />
        )}
      </div>
      {(finnishOrganization || swedishOrganization) && (
        <button
          className="get-business-id"
          data-test-id="confirm-selection"
          onClick={handleConfirm}
          disabled={!selectedOrganisation}
          type="button"
        >
          <LocalizedString translations={translations} translationKey="confirm" lang={lang} />
        </button>
      )}
    </div>
  )
}

type SelectionProps = {
  translations: LegacyTranslationDict
  lang: Language
  selectedOrganisation: SelectedOrganisation | null
  organisation: OrganizationResponse
  setSelectedOrganisation: (organisation: SelectedOrganisation | null) => void
  organisationLang: Language
}

function Selection({
  translations,
  lang,
  selectedOrganisation,
  organisation,
  setSelectedOrganisation,
  organisationLang,
}: SelectionProps) {
  const isSelected = selectedOrganisation && selectedOrganisation.lang === organisationLang

  return (
    <button
      className={`organisation-selection${isSelected ? ' selected' : ''}`}
      data-test-id={`organisation-selection-${organisationLang}`}
      onClick={() => setSelectedOrganisation({ lang: organisationLang, ...organisation })}
    >
      <div className="selection-field">
        <span className="selection-field-label">
          <strong>
            <LocalizedString translations={translations} translationKey="hakija" lang={lang} />:
          </strong>
        </span>
        <span className="selection-field-value">{organisation.name}</span>
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
        <span className="selection-field-value">{organisation.email}</span>
      </div>
      <div className="selection-field">
        <span className="selection-field-label">
          <strong>
            <LocalizedString translations={translations} translationKey="business-id" lang={lang} />
            :
          </strong>
        </span>
        <span className="selection-field-value">{organisation['organisation-id']}</span>
      </div>
    </button>
  )
}

function findFieldAnswerValue(answers: Array<{ key: string; value: string }>, fieldId: string) {
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

function shouldOpenModal(state: BaseStateLoopState<BaseStateLoopState<unknown>>): boolean {
  return (
    !state.configuration.preview &&
    state.saveStatus.savedObject !== null &&
    !!findBusinessIdRelatedFieldIdWithEmptyValue(state.form.content, state.saveStatus.values.value)
  )
}

function validateBusinessId(str: string) {
  return SyntaxValidator.validateBusinessId(str) === undefined
    ? { isDisabled: false, error: '' }
    : { isDisabled: true, error: 'error' }
}
