import React from 'react'
import FormPreviewElement from './FormPreviewElement.jsx'
import InfoElement from './InfoElement.jsx'
import WrapperPreviewElement from './WrapperPreviewElement.jsx'
import InputValueStorage from './InputValueStorage.js'
import _ from 'lodash'

export default class FormPreview extends React.Component {

  render() {
    const fields = this.props.form.content
    const lang = this.props.lang
    const translations = this.props.translations
    const model = this.props.model
    const values = this.props.values
    const infoElementValues = this.props.infoElementValues.content

    const renderField = function (field, renderingParameters) {
      const htmlId = model.constructHtmlId(fields, field.id)
      if (field.type == "formField") {
        var existingInputValue = InputValueStorage.readValue(fields, values, field.id)
        const value = _.isUndefined(existingInputValue) ? "" : existingInputValue
        return <FormPreviewElement model={model}
                                   lang={lang}
                                   key={htmlId}
                                   htmlId={htmlId}
                                   value={value}
                                   field={field}
                                   renderingParameters={renderingParameters} />
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
          const childRenderingParameters = resolveChildRenderingParameters(i)
          children.push(renderField(field.children[i], childRenderingParameters))
        }
        return <WrapperPreviewElement key={htmlId}
                                      htmlId={htmlId}
                                      field={field}
                                      lang={lang}
                                      children={children}
                                      translations={translations}
                                      renderingParameters={renderingParameters} model={model}/>
      }
    }

    return (
      <div className="soresu-preview">
        {
          fields.map(renderField)
        }
      </div>
    )
  }
}
