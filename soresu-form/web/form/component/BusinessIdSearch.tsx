import React from 'react'
import _ from 'lodash'

import ModalDialog from './ModalDialog'
import FormUtil from '../FormUtil'
import LocalizedString from './LocalizedString'
import Translator from '../Translator'
import HttpUtil from '../../HttpUtil'
import SyntaxValidator from '../SyntaxValidator'
import { Field, Language, LegacyTranslations } from 'soresu-form/web/va/types'
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

interface BusinessIdSearchState {
  modalIsOpen: boolean
  isDisabled: boolean
  error: string
  incorrectBusinessId: boolean
  otherErrorOnBusinessId: boolean
  businessId: string
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

export default class BusinessIdSearch extends React.Component<
  BusinessIdSearchProps,
  BusinessIdSearchState
> {
  private lang: Language
  private translations: LegacyTranslations['misc']
  private translator: Translator
  private formContent: Field[]

  constructor(props: BusinessIdSearchProps) {
    super(props)
    this.fetchOrganizationData = this.fetchOrganizationData.bind(this)
    this.changeFieldValue = this.changeFieldValue.bind(this)
    this.openModal = this.openModal.bind(this)
    this.closeModal = this.closeModal.bind(this)
    this.handleOnChange = this.handleOnChange.bind(this)
    this.handleOnSubmit = this.handleOnSubmit.bind(this)
    this.state = {
      modalIsOpen: shouldShowBusinessIdSearch(this.props.state),
      isDisabled: true,
      error: 'error',
      incorrectBusinessId: false,
      otherErrorOnBusinessId: false,
      businessId: '',
    }
    this.lang = this.props.state.configuration.lang
    this.translations = this.props.state.configuration.translations.misc
    this.translator = new Translator(this.props.state.configuration.translations.misc)
    this.formContent = this.props.state.form.content
  }

  openModal() {
    this.setState({ modalIsOpen: true })
  }

  closeModal() {
    this.setState({ modalIsOpen: false })
  }

  changeFieldValue(data: OrganizationResponse, fieldId: string, organizationFieldName: string) {
    const field = FormUtil.findField(this.formContent, fieldId)

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
      this.props.controller.componentOnChangeListener(field, String(fieldValue))
    }
  }

  // events from inputting the organisational id (y-tunnus)
  handleOnSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    this.setState((state) => {
      this.fetchOrganizationData(state.businessId)
      return { modalIsOpen: false }
    })
  }

  handleOnChange(event: React.ChangeEvent<HTMLInputElement>) {
    const inputted = event.target.value
    this.setState(Object.assign({ businessId: inputted }, validateBusinessId(inputted)))
  }

  // actions that happen after user has submitted their organisation-id, calls backend organisaton api
  fetchOrganizationData(id: string) {
    const language = this.props.state.configuration.lang
    HttpUtil.get<OrganizationResponse>(`/api/organisations/?organisation-id=${id}&lang=${language}`)
      .then((response) => {
        _.each(organizationToFormFieldIds, (formFieldId, organizationFieldName) => {
          if (!_.isEmpty(response[organizationFieldName as OrganizationFieldName])) {
            this.changeFieldValue(response, formFieldId, organizationFieldName)
          }
        })
      })
      .catch((error: { response: { status: number } }) => {
        if (error.response.status === 404) {
          this.setState({ incorrectBusinessId: true })
          this.openModal()
        } else {
          this.setState({
            otherErrorOnBusinessId: true,
            incorrectBusinessId: false,
          })
          this.openModal()
        }
      })
  }

  render() {
    return (
      <div>
        <ModalDialog isOpen={this.state.modalIsOpen} className="modal" overlayClassName="overlay">
          <div>
            <h1>
              <LocalizedString
                translations={this.translations}
                translationKey="give-businessid"
                lang={this.lang}
              />
            </h1>
            <p>
              <LocalizedString
                translations={this.translations}
                translationKey="organisation-info"
                lang={this.lang}
              />
            </p>
            <p id="not-found-business-id">
              {this.state.incorrectBusinessId && (
                <LocalizedString
                  translations={this.translations}
                  translationKey="not-found-business-id"
                  lang={this.lang}
                />
              )}
            </p>
            <p id="other-error-business-id">
              {this.state.otherErrorOnBusinessId && (
                <LocalizedString
                  translations={this.translations}
                  translationKey="error-with-business-id"
                  lang={this.lang}
                />
              )}
            </p>
            <form onSubmit={this.handleOnSubmit}>
              <label className="modal-label">
                <LocalizedString
                  translations={this.translations}
                  translationKey="business-id"
                  lang={this.lang}
                />
                :
                <input
                  id="finnish-business-id"
                  className={this.state.error}
                  type="text"
                  value={this.state.businessId}
                  onChange={this.handleOnChange}
                  autoFocus
                />
              </label>
              <input
                className={'get-business-id' + ' ' + 'soresu-text-button'}
                type="submit"
                value={this.translator.translate('get', this.lang)}
                disabled={this.state.isDisabled}
              />
            </form>
            <p>
              <a onClick={this.closeModal}>
                <LocalizedString
                  translations={this.translations}
                  translationKey="cancel"
                  lang={this.lang}
                />
              </a>
            </p>
          </div>
        </ModalDialog>
      </div>
    )
  }
}
