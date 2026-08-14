import React, { useState } from 'react'
import _ from 'lodash'

import FormUtil from '../FormUtil'
import LocalizedString from './LocalizedString'
import Translator from '../Translator'
import SyntaxValidator from '../SyntaxValidator'
import { Field, Language, LegacyTranslationDict } from 'soresu-form/web/va/types'
import { BaseStateLoopState } from 'soresu-form/web/form/types/Form'
import HttpUtil from 'soresu-form/web/HttpUtil'

import './OrganisationSelection.css'

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

const organizationToFormFieldIds = {
  name: 'organization',
  email: 'organization-email',
  'organisation-id': 'business-id',
  contact: 'organization-postal-address',
} as const

interface FormController {
  componentOnChangeListener: (field: Field, value: string) => void
  applyServerHakemus: (hakemus: unknown) => void
}

interface OwnerTypeLookup {
  ytunnus: string
  ownerType: string | null
  status: 'loading' | 'done' | 'error'
}

interface SelectedOrganisation extends OrganizationResponse {
  lang: Language
}

interface OrganisationRequestError {
  response: { status: number }
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
  const [ownerTypeLookup, setOwnerTypeLookup] = useState<OwnerTypeLookup | null>(null)

  const lang = state.configuration.lang
  const translations = state.configuration.translations.misc
  const translator = new Translator(state.configuration.translations.misc)

  const selectableOrganisations = getSelectableOrganisations(
    finnishOrganization,
    swedishOrganization
  )

  const handleConfirm = () => {
    if (!selectedOrganisation) {
      return
    }
    const postalAddress = _.trim(
      `${selectedOrganisation.contact.address || ''} ${selectedOrganisation.contact['postal-number'] || ''} ${selectedOrganisation.contact.city || ''}`
    )
    const avustushakuId = state.avustushaku?.id
    const userKey = state.saveStatus.hakemusId
    const baseVersion = state.saveStatus.savedObject?.version
    if (avustushakuId === undefined || !userKey || baseVersion === undefined) {
      return
    }
    const body = {
      organisation: {
        name: selectedOrganisation.name,
        email: selectedOrganisation.email,
        'organisation-id': selectedOrganisation['organisation-id'],
        'postal-address': postalAddress,
      },
    }
    HttpUtil.post(
      `/api/avustushaku/${avustushakuId}/hakemus/${userKey}/${baseVersion}/vahvista-organisaatio`,
      body
    ).then((updated) => {
      controller.applyServerHakemus(updated)
      setModalIsOpen(false)
    })
  }

  return (
    <div>
      <dialog open={modalIsOpen} className="overlay">
        <div className="organisation-modal">
          <BusinessIdSearch
            translator={translator}
            lang={lang}
            translations={translations}
            setFinnishOrganization={setFinnishOrganization}
            setSwedishOrganization={setSwedishOrganization}
            setSelectedOrganisation={setSelectedOrganisation}
            setOwnerTypeLookup={setOwnerTypeLookup}
          />
          {selectableOrganisations.length > 0 && (
            <Selector
              translations={translations}
              lang={lang}
              selectableOrganisations={selectableOrganisations}
              setSelectedOrganisation={setSelectedOrganisation}
              handleConfirm={handleConfirm}
              selectedOrganisation={selectedOrganisation}
              ownerTypeLookupLoading={ownerTypeLookup?.status === 'loading'}
            />
          )}
        </div>
      </dialog>
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
  setOwnerTypeLookup: React.Dispatch<React.SetStateAction<OwnerTypeLookup | null>>
}

function BusinessIdSearch({
  translator,
  translations,
  lang,
  setFinnishOrganization,
  setSwedishOrganization,
  setSelectedOrganisation,
  setOwnerTypeLookup,
}: BusinessIdSearchProps) {
  const [isDisabled, setIsDisabled] = useState(true)
  const [error, setError] = useState('error')
  const [incorrectBusinessId, setIncorrectBusinessId] = useState(false)
  const [otherErrorOnBusinessId, setOtherErrorOnBusinessId] = useState(false)
  const [businessId, setBusinessId] = useState('')

  // actions that happen after user has submitted their organisation-id, calls backend organisaton api
  const fetchOrganizationData = (id: string) => {
    setSelectedOrganisation(null)

    const fetchOrganisation = (lang: Language) =>
      HttpUtil.get<OrganizationResponse>(`/api/organisations/?organisation-id=${id}&lang=${lang}`)
        .then((organisation) => ({ organisation, error: null }))
        .catch((error: OrganisationRequestError) => ({ organisation: null, error }))

    // both languages are awaited together: a single arrived organisation would otherwise look like
    // the only search result and get preselected even though the other language is still coming
    Promise.all([fetchOrganisation('fi'), fetchOrganisation('sv')]).then(([finnish, swedish]) => {
      setFinnishOrganization(finnish.organisation)
      setSwedishOrganization(swedish.organisation)

      // a single organisation leaves nothing to choose between, so preselect it. when both a finnish
      // and a swedish organisation are found the hakija has to pick one of them.
      const selectableOrganisations = getSelectableOrganisations(
        finnish.organisation,
        swedish.organisation
      )
      setSelectedOrganisation(
        selectableOrganisations.length === 1 ? selectableOrganisations[0] : null
      )

      const errors = [finnish.error, swedish.error].filter((error) => error !== null)
      const noOrganisationFound = errors.length === 2
      const someErrorIsNotNotFound = errors.some((error) => error.response.status !== 404)
      setIncorrectBusinessId(noOrganisationFound && !someErrorIsNotNotFound)
      setOtherErrorOnBusinessId(noOrganisationFound && someErrorIsNotNotFound)
    })

    setOwnerTypeLookup({ ytunnus: id, ownerType: null, status: 'loading' })
    HttpUtil.get<{ 'owner-type': string }>(`/api/organisation-type/?organisation-id=${id}`)
      .then((response) => {
        setOwnerTypeLookup((prev) =>
          prev?.ytunnus === id
            ? { ytunnus: id, ownerType: response['owner-type'], status: 'done' }
            : prev
        )
      })
      .catch(() => {
        setOwnerTypeLookup((prev) =>
          prev?.ytunnus === id ? { ytunnus: id, ownerType: null, status: 'error' } : prev
        )
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

  const contactEmail = lang === 'sv' ? 'statsunderstod@oph.fi' : 'valtionavustukset@oph.fi'

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
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
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
  selectableOrganisations: SelectedOrganisation[]
  setSelectedOrganisation: (organisation: SelectedOrganisation | null) => void
  selectedOrganisation: SelectedOrganisation | null
  handleConfirm: () => void
  ownerTypeLookupLoading?: boolean
}

function Selector({
  translations,
  lang,
  selectableOrganisations,
  setSelectedOrganisation,
  selectedOrganisation,
  handleConfirm,
  ownerTypeLookupLoading,
}: SelectorProps) {
  const hakijaHasToChoose = selectableOrganisations.length > 1

  return (
    <div className="selector-wrapper">
      <LocalizedString
        translations={translations}
        translationKey="confirm-business-id-info"
        lang={lang}
      />
      <div className="selector">
        {selectableOrganisations.map((organisation) => (
          <Selection
            key={organisation.lang}
            translations={translations}
            lang={lang}
            organisation={organisation}
            setSelectedOrganisation={setSelectedOrganisation}
            selectedOrganisation={selectedOrganisation}
            hakijaHasToChoose={hakijaHasToChoose}
          />
        ))}
      </div>
      <button
        className="get-business-id"
        data-test-id="confirm-selection"
        onClick={handleConfirm}
        disabled={!selectedOrganisation || ownerTypeLookupLoading}
        type="button"
      >
        <LocalizedString translations={translations} translationKey="confirm" lang={lang} />
      </button>
    </div>
  )
}

type SelectionProps = {
  translations: LegacyTranslationDict
  lang: Language
  selectedOrganisation: SelectedOrganisation | null
  organisation: SelectedOrganisation
  setSelectedOrganisation: (organisation: SelectedOrganisation | null) => void
  hakijaHasToChoose: boolean
}

function Selection({
  translations,
  lang,
  selectedOrganisation,
  organisation,
  setSelectedOrganisation,
  hakijaHasToChoose,
}: SelectionProps) {
  const isSelected = selectedOrganisation?.lang === organisation.lang

  return (
    <label
      className={`organisation-selection${hakijaHasToChoose ? ' choosable' : ''}${isSelected ? ' selected' : ''}`}
      data-test-id={`organisation-selection-${organisation.lang}`}
    >
      {hakijaHasToChoose && (
        <input
          type="radio"
          className="organisation-selection-radio"
          name="organisation-selection"
          value={organisation.lang}
          checked={isSelected}
          onChange={() => setSelectedOrganisation(organisation)}
        />
      )}
      <div className="selection-fields">
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
              <LocalizedString
                translations={translations}
                translationKey="business-id"
                lang={lang}
              />
              :
            </strong>
          </span>
          <span className="selection-field-value">{organisation['organisation-id']}</span>
        </div>
      </div>
    </label>
  )
}

function organisationInformationIsSameForBothLang(
  finnishOrganization: OrganizationResponse | null,
  swedishOrganization: OrganizationResponse | null
) {
  return Boolean(
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
  )
}

// the swedish organisation is only offered when it actually differs from the finnish one
function getSelectableOrganisations(
  finnishOrganization: OrganizationResponse | null,
  swedishOrganization: OrganizationResponse | null
): SelectedOrganisation[] {
  const selectable: SelectedOrganisation[] = []
  if (finnishOrganization) {
    selectable.push({ ...finnishOrganization, lang: 'fi' })
  }
  if (
    swedishOrganization &&
    !organisationInformationIsSameForBothLang(finnishOrganization, swedishOrganization)
  ) {
    selectable.push({ ...swedishOrganization, lang: 'sv' })
  }
  return selectable
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
