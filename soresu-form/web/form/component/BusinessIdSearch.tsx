import React, { useCallback, useEffect, useRef, useState } from 'react'
import _ from 'lodash'

import FormUtil from '../FormUtil'
import LocalizedString from './LocalizedString'
import Translator from '../Translator'
import HttpUtil from '../../HttpUtil'
import SyntaxValidator from '../SyntaxValidator'

import * as styles from './BusinessIdSearch.module.css'

const organizationToFormFieldIds = {
  name: 'organization',
  email: 'organization-email',
  'organisation-id': 'business-id',
  contact: 'organization-postal-address',
} as const

type FieldID = string
type ConfirmationValues = Record<FieldID, { label: string; value: string }>

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
  const lang = state.configuration.lang as 'fi' | 'sv'
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
  const [confirmValues, setConfirmValues] = useState<ConfirmationValues | undefined>()

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

  const getNewFieldValue = (data: any, fieldId: string, organizationFieldName: string) => {
    const field = FormUtil.findField(formContent, fieldId)
    // nothing to change
    if (!field) {
      return
    }
    return organizationFieldName === 'contact'
      ? _.trim(
          `${data.contact?.address || ''} ${data.contact?.['postal-number'] || ''} ${
            data.contact?.city || ''
          }`
        )
      : data[organizationFieldName]
  }

  const onConfirm = (confirmValues: ConfirmationValues) => {
    for (const [fieldId, { value }] of Object.entries(confirmValues)) {
      const field = FormUtil.findField(formContent, fieldId)
      if (!field) {
        return // nothing to change
      }
      controller.componentOnChangeListener(field, value)
    }
    closeModal()
  }

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setConfirmValues(undefined)
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
      const confirmValues = Object.entries(organizationToFormFieldIds).reduce(
        (acc, [fieldName, fieldId]) => {
          const field = FormUtil.findField(formContent, fieldId)
          if (field) {
            acc[field.id] = {
              label: field?.label?.[lang] ?? field.id,
              value: getNewFieldValue(response, fieldId, fieldName),
            }
          }
          return acc
        },
        {} as ConfirmationValues
      )
      setConfirmValues(confirmValues)
      setIncorrectBusinessId(false)
      setOtherErrorOnBusinessId(false)
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setIncorrectBusinessId(true)
        setOtherErrorOnBusinessId(false)
      } else {
        setOtherErrorOnBusinessId(true)
        setIncorrectBusinessId(false)
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
          <form onSubmit={handleOnSubmit} className={styles.formGrid}>
            <label>
              <LocalizedString
                translations={translations}
                translationKey="business-id"
                lang={lang}
              />
              :
            </label>
            <input
              id="finnish-business-id"
              className={error}
              type="text"
              value={businessId}
              onChange={handleOnChange}
              autoFocus
            />
            <input
              className={'get-business-id' + ' ' + 'soresu-text-button'}
              type="submit"
              value={translator.translate('get', lang)}
              disabled={isDisabled}
            />
          </form>
          {confirmValues && (
            <>
              <p>Tarkista alla olevat tiedot oikeiksi ennenkuin jatkat hakemuksen täyttöä</p>
              <form
                className={styles.formGrid}
                onSubmit={(e) => {
                  e.preventDefault()
                  onConfirm(confirmValues)
                }}
              >
                {Object.entries(confirmValues).map(([key, { label, value }], index) => {
                  return (
                    <React.Fragment key={key}>
                      <span className={styles.label}>{label}:</span>
                      <span className={styles.input}>{value}</span>
                      {index + 1 === Object.entries(confirmValues).length ? (
                        <input
                          className={'get-business-id' + ' ' + 'soresu-text-button'}
                          type="submit"
                          value={'Vahvista'}
                        />
                      ) : (
                        <div />
                      )}
                    </React.Fragment>
                  )
                })}
              </form>
            </>
          )}
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
