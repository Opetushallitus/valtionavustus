import React from 'react'
import _ from 'lodash'

import FormPreview from 'soresu-form/web/form/FormPreview'
import { dropFirstInfoFields } from 'soresu-form/web/form/FormPreviewTS'
import { mapAnswersWithMuutoshakemusData } from 'soresu-form/web/va/MuutoshakemusMapper'
import { Answer, Field } from 'soresu-form/web/va/types'

type EmbeddedDecisionVersionDiffFormViewProps = {
  controller: any
  infoElementValues: any
  state: any
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isAnswer = (value: unknown): value is Answer =>
  isRecord(value) && typeof value.key === 'string' && Object.prototype.hasOwnProperty.call(value, 'value')

const toAnswers = (value: unknown): Answer[] => (Array.isArray(value) ? value.filter(isAnswer) : [])

const toValueByKey = (answers: Answer[]) => {
  const valueByKey = new Map<string, unknown>()
  for (const answer of answers) {
    valueByKey.set(answer.key, answer.value)
  }
  return valueByKey
}

const toGrowingFieldsetChildValueByKey = (value: unknown) => {
  const childValueByKey = new Map<string, unknown>()
  if (!Array.isArray(value)) {
    return childValueByKey
  }

  for (const row of value) {
    if (!isRecord(row) || !Array.isArray(row.value)) {
      continue
    }
    for (const child of row.value) {
      if (!isRecord(child) || typeof child.key !== 'string') {
        continue
      }
      childValueByKey.set(child.key, child.value)
    }
  }

  return childValueByKey
}

const toChangedOldValueByKey = (originalAnswers: Answer[], mappedAnswers: Answer[]) => {
  const originalValueByKey = toValueByKey(originalAnswers)
  const mappedValueByKey = toValueByKey(mappedAnswers)
  const changedOldValueByKey = new Map<string, unknown>()

  for (const key of new Set([...originalValueByKey.keys(), ...mappedValueByKey.keys()])) {
    const originalValue = originalValueByKey.get(key)
    const mappedValue = mappedValueByKey.get(key)

    if (key === 'other-organizations') {
      const originalChildValueByKey = toGrowingFieldsetChildValueByKey(originalValue)
      const mappedChildValueByKey = toGrowingFieldsetChildValueByKey(mappedValue)
      for (const childKey of new Set([
        ...originalChildValueByKey.keys(),
        ...mappedChildValueByKey.keys(),
      ])) {
        const originalChildValue = originalChildValueByKey.get(childKey)
        const mappedChildValue = mappedChildValueByKey.get(childKey)
        if (!_.isEqual(originalChildValue, mappedChildValue)) {
          changedOldValueByKey.set(childKey, originalChildValue)
        }
      }
      continue
    }

    if (!_.isEqual(originalValue, mappedValue)) {
      changedOldValueByKey.set(key, originalValue)
    }
  }

  return changedOldValueByKey
}

const mapAnswersForPreview = (state: any, originalAnswers: Answer[]): Answer[] => {
  const avustushaku = state.avustushaku
  if (!avustushaku) {
    return originalAnswers
  }
  return mapAnswersWithMuutoshakemusData(
    avustushaku,
    originalAnswers,
    state.muutoshakemukset,
    state.normalizedHakemus
  )
}

const withAnswers = (state: any, answers: Answer[]) => {
  return {
    ...state,
    saveStatus: {
      ...state.saveStatus,
      values: {
        ...state.saveStatus.values,
        value: answers,
      },
    },
  }
}

export default class EmbeddedDecisionVersionDiffFormView extends React.Component<EmbeddedDecisionVersionDiffFormViewProps> {
  static renderField(
    controller: any,
    state: any,
    infoElementValues: any,
    field: Field,
    changedOldValueByKey: Map<string, unknown>,
    renderingParameters?: any
  ) {
    const fields = state.form.content
    const htmlId = controller.constructHtmlId(fields, field.id)
    const translations = state.configuration.translations
    const fieldProperties = {
      fieldType: field.fieldType,
      lang: state.configuration.lang,
      key: htmlId,
      htmlId,
      field,
      controller,
      translations,
    }

    if (field.fieldClass === 'formField') {
      if (changedOldValueByKey.has(field.id)) {
        const oldValue = changedOldValueByKey.get(field.id)
        return (
          <div key={`diff-display-${field.id}`}>
            <div className="answer-old-value">
              {FormPreview.renderField(controller, null, state, infoElementValues, field, {
                ...renderingParameters,
                overridingInputValue: oldValue,
              })}
            </div>
            <div className="answer-new-value">
              {FormPreview.renderField(
                controller,
                null,
                state,
                infoElementValues,
                field,
                renderingParameters
              )}
            </div>
          </div>
        )
      }
      return FormPreview.createFormPreviewComponent(
        controller,
        state,
        field,
        fieldProperties,
        renderingParameters
      )
    }

    if (field.fieldClass === 'infoElement') {
      return FormPreview.createInfoComponent(state, infoElementValues, field, fieldProperties, true)
    }

    if (field.fieldClass === 'wrapperElement') {
      return FormPreview.createWrapperComponent(
        (
          wrapperController: any,
          _formEditController: any,
          wrapperState: any,
          wrapperInfoElementValues: any,
          wrapperField: Field,
          wrapperRenderingParameters: any
        ) =>
          EmbeddedDecisionVersionDiffFormView.renderField(
            wrapperController,
            wrapperState,
            wrapperInfoElementValues,
            wrapperField,
            changedOldValueByKey,
            wrapperRenderingParameters
          ),
        controller,
        null,
        state,
        infoElementValues,
        field,
        fieldProperties,
        renderingParameters
      )
    }

    return undefined
  }

  render() {
    const { controller, infoElementValues, state } = this.props
    const originalAnswers = toAnswers(state.saveStatus.values?.value)
    const mappedAnswers = mapAnswersForPreview(state, originalAnswers)
    const changedOldValueByKey = toChangedOldValueByKey(originalAnswers, mappedAnswers)
    const mappedState = withAnswers(state, mappedAnswers)
    const previewInfoElementValues = infoElementValues.content

    const fields = mappedState.configuration.embedForMuutoshakemus
      ? dropFirstInfoFields(mappedState.form.content)
      : mappedState.form.content

    return (
      <div className="soresu-preview muutoshakemus-embedded-diff-preview">
        {fields.map((field: Field) =>
          EmbeddedDecisionVersionDiffFormView.renderField(
            controller,
            mappedState,
            previewInfoElementValues,
            field,
            changedOldValueByKey
          )
        )}
      </div>
    )
  }
}
