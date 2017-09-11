import React from 'react'
import _ from 'lodash'

import styles from './style/preview.less'

import FormPreviewComponent from './preview/FormPreviewComponent.jsx'
import InfoElement from './component/InfoElement.jsx'
import WrapperPreviewComponent from './preview/wrapper/WrapperPreviewComponent.jsx'
import InputValueStorage from './InputValueStorage.js'

export default class FormPreview extends React.Component {

  static renderField(controller, formEditController, state, infoElementValues, field, renderingParameters) {
    const fields = state.form.content
    const htmlId = controller.constructHtmlId(fields, field.id)
    const translations = state.configuration.translations
    const fieldProperties = { fieldType: field.fieldType, lang: state.configuration.lang, key: htmlId, htmlId: htmlId, field: field, controller: controller, translations: translations }
    if (field.fieldClass == "formField") {
      return FormPreview.createFormPreviewComponent(controller, state, field, fieldProperties, renderingParameters)
    } else if (field.fieldClass == "infoElement") {
      return FormPreview.createInfoComponent(state, infoElementValues, field, fieldProperties, true)
    } else if (field.fieldClass == "wrapperElement") {
      return FormPreview.createWrapperComponent(FormPreview.renderField, controller, formEditController, state, infoElementValues, field, fieldProperties, renderingParameters)
    }
  }

  static createFormPreviewComponent(controller, state, field, fieldProperties, renderingParameters) {
    const attachment = state.saveStatus.attachments[field.id]
    const attachmentDownloadUrl= controller.createAttachmentDownloadUrl(state, field)
    return FormPreview._createFormPreviewComponent(controller, state, field, fieldProperties, renderingParameters, attachment, attachmentDownloadUrl)
  }

  static _createFormPreviewComponent(controller, state, field, fieldProperties, renderingParameters, attachment, attachmentDownloadUrl) {
    const values = state.saveStatus.values
    const fields = state.form.content
    var existingInputValue = (renderingParameters && !_.isUndefined(renderingParameters.overridingInputValue)) ? renderingParameters.overridingInputValue : InputValueStorage.readValue(fields, values, field.id)
    const value = _.isUndefined(existingInputValue) ? "" : existingInputValue
    return <FormPreviewComponent {...fieldProperties}
        value={value}
        renderingParameters={renderingParameters}
        customProps={controller.getCustomComponentProperties(state)}
        attachment={attachment}
        attachmentDownloadUrl={attachmentDownloadUrl}/>
  }

  static createInfoComponent(state, infoElementValues, field, fieldProperties, hideAccordingToPreviewParam) {
    if (hideAccordingToPreviewParam && field.params && field.params.preview === false) {
      return undefined
    }
    const values = state.saveStatus.values
    return <InfoElement {...fieldProperties}
        values={infoElementValues}
        answersObject={values} />
  }

  static createWrapperComponent(renderFieldFunction, controller, editorController, state, infoElementValues, field, fieldProperties, renderingParameters) {
    const values = state.saveStatus.values
    const fields = state.form.content

    const resolveChildRenderingParameters = childIndex => {
      const result = _.isObject(renderingParameters) ? _.cloneDeep(renderingParameters) : {}
      result.childIndex = childIndex
      const isFirstChild = childIndex === 0
      if (field.params && field.params.showOnlyFirstLabels === true && !isFirstChild) {
        result.hideLabels = true
      }
      const existingInputValue = InputValueStorage.readValue(fields, values, field.children[childIndex].id)
      if (_.isEmpty(existingInputValue)) {
        result.valueIsEmpty = true
      }
      return result
    }

    const children = []
    for (var i = 0; i < field.children.length; i++) {
      const childRenderingParameters = resolveChildRenderingParameters(i)
      children.push(renderFieldFunction(controller, editorController, state, infoElementValues, field.children[i], childRenderingParameters))
    }

    return <WrapperPreviewComponent {...fieldProperties}
        children={children}
        renderingParameters={renderingParameters}
        controller={controller}
        customProps={controller.getCustomComponentProperties(state)}
        answersObject={values} />
  }

  render() {
    const controller = this.props.controller
    const infoElementValues = this.props.infoElementValues.content
    const state = this.props.state
    const fields = state.form.content

    const renderField = function(field) {
      return FormPreview.renderField(controller, null, state, infoElementValues, field)
    }

    return  <div className="soresu-preview">
              {fields.map(renderField) }
            </div>
  }
}
