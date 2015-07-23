import React from 'react'
import FormComponent from './component/FormComponent.jsx'
import InfoElement from './component/InfoElement.jsx'
import WrapperComponent from './component/wrapper/WrapperComponent.jsx'
import InputValueStorage from './InputValueStorage.js'
import _ from 'lodash'

export default class Form extends React.Component {

  render() {
    const lang = this.props.lang
    const infoElementValues = this.props.infoElementValues.content
    const translations = this.props.translations
    const controller = this.props.controller
    const state = this.props.state
    const saved = controller.isSaveDraftAllowed(state)
    const fields = state.form.content
    const validationErrors = state.validationErrors
    const values = state.saveStatus.values

    console.log("hiiohoi", state)
    const renderField = function (field, renderingParameters) {
      const htmlId = controller.constructHtmlId(fields, field.id)
      const formOperations = state.extensionApi.formOperations
      const fieldDisabled = !formOperations.isFieldEnabled(saved, field.id) || field.forceDisabled === true

      if (field.type == "formField") {
        var existingInputValue = InputValueStorage.readValue(fields, values, field.id)
        const value = _.isUndefined(existingInputValue) ? "" : existingInputValue
        const fieldErrors = _.get(validationErrors, field.id, [])
        return <FormComponent validationErrors={fieldErrors}
                              translations={translations}
                              controller={controller}
                              lang={lang}
                              key={htmlId}
                              htmlId={htmlId}
                              value={value}
                              field={field}
                              renderingParameters={renderingParameters}
                              disabled={fieldDisabled}
                              onChange={controller.componentOnChangeListener}/>
      } else if (field.type == "infoElement") {
        return <InfoElement key={htmlId}
                            htmlId={htmlId}
                            field={field}
                            values={infoElementValues}
                            lang={lang}
                            translations={translations} />
      } else if (field.type == "wrapperElement") {
        const children = []
        for (var i=0; i < field.children.length; i++) {
          function resolveChildRenderingParameters(childIndex) {
            const result = _.isObject(renderingParameters) ? _.cloneDeep(renderingParameters) : { }
            result.childIndex = childIndex
            result.removeMe = function() {
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
        return <WrapperComponent key={htmlId}
                                 htmlId={htmlId}
                                 field={field}
                                 lang={lang}
                                 children={children}
                                 disabled={fieldDisabled}
                                 translations={translations}
                                 renderingParameters={renderingParameters}
                                 controller={controller}
                                 customProps={customProperties}
                                 answersObject={values} />
      }
    }

    return (
      <form className="soresu-form">
        {
          fields.map(renderField)
        }
      </form>
    )
  }
}
