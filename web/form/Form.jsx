import React from 'react'
import FormComponent from './element/FormComponent.jsx'
import InfoElement from './element/InfoElement.jsx'
import WrapperComponent from './element/wrapper/WrapperComponent.jsx'
import InputValueStorage from './InputValueStorage.js'
import _ from 'lodash'

export default class Form extends React.Component {

  render() {
    const form = this.props.form
    const fields = form.content
    const lang = this.props.lang
    const model = this.props.model
    const values = this.props.values
    const infoElementValues = this.props.infoElementValues.content
    const validationErrors = this.props.validationErrors
    const translations = this.props.translations
    const saved = this.props.saved
    const state = this.props.state

    const renderField = function (field, renderingParameters) {
      const htmlId = model.constructHtmlId(fields, field.id)
      const fieldDisabled = !model.formOperations.isFieldEnabled(saved, model, field.id) || field.forceDisabled === true

      if (field.type == "formField") {
        var existingInputValue = InputValueStorage.readValue(fields, values, field.id)
        const value = _.isUndefined(existingInputValue) ? "" : existingInputValue
        const fieldErrors = _.get(validationErrors, field.id, [])
        return <FormComponent validationErrors={fieldErrors}
                              translations={translations}
                              model={model}
                              lang={lang}
                              key={htmlId}
                              htmlId={htmlId}
                              value={value}
                              field={field}
                              renderingParameters={renderingParameters}
                              disabled={fieldDisabled}
                              onChange={model.componentOnChangeListener}/>
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
              model.removeField(field.children[childIndex])
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
        return <WrapperComponent key={htmlId}
                                 htmlId={htmlId}
                                 field={field}
                                 lang={lang}
                                 children={children}
                                 disabled={fieldDisabled}
                                 translations={translations}
                                 renderingParameters={renderingParameters}
                                 model={model}
                                 customProps={model.getCustomWrapperComponentProperties(state)}
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
