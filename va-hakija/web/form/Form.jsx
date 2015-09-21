import React from 'react'
import _ from 'lodash'

import styles from './style/main.less'

import FormComponent from './component/FormComponent.jsx'
import InfoElement from 'va-common/web/form/component/InfoElement.jsx'
import WrapperComponent from './component/wrapper/WrapperComponent.jsx'
import InputValueStorage from 'va-common/web/form/InputValueStorage.js'

export default class Form extends React.Component {
  render() {
    const infoElementValues = this.props.infoElementValues.content
    const controller = this.props.controller
    const state = this.props.state
    const fields = state.form.content
    const validationErrors = state.form.validationErrors
    const values = state.saveStatus.values

    const renderField = function (field, renderingParameters) {
      const htmlId = controller.constructHtmlId(fields, field.id)
      const fieldProperties = {
        fieldType: field.displayAs,
        lang: state.configuration.lang,
        key: htmlId,
        htmlId: htmlId,
        field: field,
        translations: state.configuration.translations
      }

      if (field.type == "infoElement") {
        return createInfoElement(fieldProperties)
      } else {
        const formOperations = state.extensionApi.formOperations
        const saved = controller.isSaveDraftAllowed(state)
        const fieldDisabled = !formOperations.isFieldEnabled(saved, field.id) || field.forceDisabled === true
        const extendedProperties = _.extend(fieldProperties, { controller: controller,
                                                               disabled: fieldDisabled,
                                                               renderingParameters: renderingParameters,
                                                               attachments: state.saveStatus.attachments,
                                                               attachmentUploadsInProgress: state.saveStatus.attachmentUploadsInProgress})

        if (field.type == "formField") {
          return createFormComponent(field, extendedProperties)
        } else if (field.type == "button") {
          return createButton(field, extendedProperties)
        } else if (field.type == "wrapperElement") {
          return createWrapperElement(field, extendedProperties, renderingParameters)
        }
      }
    }

    return <form className="soresu-form">
            {fields.map(renderField)}
           </form>

    function createInfoElement(fieldProperties) {
      return <InfoElement {...fieldProperties}
                          values={infoElementValues} />
    }

    function createButton(field, extendedProperties) {
      return createFormComponent(field, extendedProperties)
    }

    function createFormComponent(field, extendedProperties) {
      const existingInputValue = InputValueStorage.readValue(fields, values, field.id)
      const value = _.isUndefined(existingInputValue) ? "" : existingInputValue
      const fieldErrors = _.get(validationErrors, field.id, [])
      return <FormComponent {...extendedProperties}
                            validationErrors={fieldErrors}
                            value={value}
                            onChange={controller.componentOnChangeListener} />
    }

    function createWrapperElement(field, fieldProperties, renderingParameters) {
      const children = []
      for (var i = 0; i < field.children.length; i++) {
        function resolveChildRenderingParameters(childIndex) {
          const result = _.isObject(renderingParameters) ? _.cloneDeep(renderingParameters) : {}
          result.childIndex = childIndex
          result.removeMe = function () {
            controller.removeField(field.children[childIndex])
          }
          const isFirstChild = childIndex === 0
          if (field.params && field.params.showOnlyFirstLabels === true && !isFirstChild) {
            result.hideLabels = true
          }
          const isSecondToLastChild = childIndex === field.children.length - 2
          if (isSecondToLastChild) {
            const nextChild = field.children[childIndex + 1]
            const nextChildIsDisabled = _.isObject(nextChild) ? nextChild.forceDisabled : false
            if (nextChildIsDisabled) {
              result.rowMustNotBeRemoved = true
            }
          }
          return result
        }

        const childRenderingParameters = resolveChildRenderingParameters(i)
        children.push(renderField(field.children[i], childRenderingParameters))
      }
      const customProperties = controller.getCustomWrapperComponentProperties(state);
      return <WrapperComponent {...fieldProperties}
                               children={children}
                               customProps={customProperties}
                               answersObject={values} />
    }
  }
}
