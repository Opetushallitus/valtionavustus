import React from 'react'
import FormPreviewComponent from './preview/FormPreviewComponent.jsx'
import InfoElement from './component/InfoElement.jsx'
import WrapperPreviewComponent from './preview/wrapper/WrapperPreviewComponent.jsx'
import InputValueStorage from './InputValueStorage.js'
import _ from 'lodash'

export default class FormPreview extends React.Component {

  render() {
    const lang = this.props.lang
    const translations = this.props.translations
    const controller = this.props.controller
    const infoElementValues = this.props.infoElementValues.content
    const state = this.props.state
    const fields = state.form.content
    const values = state.saveStatus.values

    const renderField = function (field, renderingParameters) {
      const htmlId = controller.constructHtmlId(fields, field.id)
      if (field.type == "formField") {
        var existingInputValue = InputValueStorage.readValue(fields, values, field.id)
        const value = _.isUndefined(existingInputValue) ? "" : existingInputValue
        return <FormPreviewComponent controller={controller}
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
        const customProperties = controller.getCustomWrapperComponentProperties(state);
        return <WrapperPreviewComponent key={htmlId}
                                        htmlId={htmlId}
                                        field={field}
                                        lang={lang}
                                        children={children}
                                        translations={translations}
                                        renderingParameters={renderingParameters}
                                        controller={controller}
                                        customProps={customProperties}
                                        answersObject={values} />
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
