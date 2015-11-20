import React from 'react'
import _ from 'lodash'

import JsUtil from 'soresu-form/web/form/JsUtil'
import FormPreview from 'soresu-form/web/form/FormPreview.jsx'


export default class EditsDisplayingFormView extends React.Component {
  static renderField(controller, formEditController, state, infoElementValues, field) {
    const fields = state.form.content
    const htmlId = controller.constructHtmlId(fields, field.id)
    const fieldProperties = { fieldType: field.fieldType, lang: state.configuration.lang, key: htmlId, htmlId: htmlId, field: field }
    if (field.fieldClass == "formField") {
      const oldAnswer = _.find(state.originalValuesOfChangedFields, a => { return a.key === field.id })
      if (oldAnswer) {
        return <DiffDisplayingField key={"diff-display-" + field.id} field={field} oldAnswer={oldAnswer}
                                    state={state} infoElementValues={infoElementValues} controller={controller} />
      }
      return FormPreview.createFormPreviewComponent(controller, state, field, fieldProperties)
    } else if (field.fieldClass == "infoElement") {
      return FormPreview.createInfoComponent(state, infoElementValues, field, fieldProperties, true)
    } else if (field.fieldClass == "wrapperElement") {
      return FormPreview.createWrapperComponent(EditsDisplayingFormView.renderField, controller, formEditController, state, infoElementValues, field, fieldProperties)
    }
  }


  render() {
    const controller = this.props.controller
    const infoElementValues = this.props.infoElementValues.content
    const state = this.props.state
    const fields = state.form.content
    state.originalValuesOfChangedFields = resolveChangedFields(state.saveStatus.values, state.changeRequests)

    const renderField = field => {
      return EditsDisplayingFormView.renderField(controller, null, state, infoElementValues, field)
    }

    return  <div className="soresu-preview">
              {fields.map(renderField) }
            </div>

    function resolveChangedFields(currentAnswers, changeRequests) {
      if (!changeRequests || changeRequests.length === 0) {
        return []
      }
      const oldestAnswers = changeRequests[0].answers
      return JsUtil.flatFilter(oldestAnswers, oldAnswer => {
        const newValueArray = JsUtil.flatFilter(currentAnswers, newAnswer => newAnswer.key === oldAnswer.key)
        return newValueArray.length === 0 || newValueArray[0].value != oldAnswer.value
      })
    }
  }
}

class DiffDisplayingField extends React.Component {
  render() {
    const field = this.props.field
    const oldAnswer = this.props.oldAnswer
    const state = this.props.state
    const controller = this.props.controller
    const infoElementValues = this.props.infoElementValues
    return <div>
             <div key="answer-old-value" className="answer-old-value">
               {FormPreview.renderField(controller, null, state, infoElementValues, field, { overridingInputValue: oldAnswer.value })}
             </div>
             <div key="answer-new-value" className="answer-new-value">
               {FormPreview.renderField(controller, null, state, infoElementValues, field)}
             </div>
           </div>
  }
}
