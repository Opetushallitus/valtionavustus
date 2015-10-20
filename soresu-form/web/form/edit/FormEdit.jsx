import React from 'react'
import _ from 'lodash'

import styles from '../style/preview.less'
import printStyles from '../style/print.less'

import FormPreview from '../FormPreview.jsx'

export default class FormEdit extends React.Component {

  static renderField(controller, state, infoElementValues, field, renderingParameters) {
    const fields = state.form.content
    const htmlId = controller.constructHtmlId(fields, field.id)
    const fieldProperties = { fieldType: field.fieldType, lang: state.configuration.lang, key: htmlId, htmlId: htmlId, field: field }
    var fieldElement = undefined
    if (field.fieldClass == "formField") {
      fieldElement =  FormPreview.createFormPreviewComponent(controller, state, field, fieldProperties, renderingParameters)
    } else if (field.fieldClass == "infoElement") {
      fieldElement =  FormPreview.createInfoComponent(state, infoElementValues, field, fieldProperties, false)
    } else if (field.fieldClass == "wrapperElement") {
      if(controller.getCustomPreviewComponentTypeMapping()[field.fieldType]) {
        fieldElement = FormPreview.createWrapperComponent(FormPreview.renderField, controller, state, infoElementValues, field, fieldProperties, renderingParameters)
      }
      else {
        fieldElement = FormPreview.createWrapperComponent(FormEdit.renderField, controller, state, infoElementValues, field, fieldProperties, renderingParameters)
      }
    }
    return (
      <div key={htmlId} className="soresu-edit soresu-field-edit">
        <h3>{field.fieldClass + ": " + field.fieldType}</h3>
        {fieldElement}
      </div>
    )
  }

  render() {
    const controller = this.props.controller
    const infoElementValues = this.props.infoElementValues.content
    const state = this.props.state
    const fields = state.form.content

    const renderField = function(field) {
      return FormEdit.renderField(controller, state, infoElementValues, field)
    }

    return  <div className="soresu-edit soresu-form-edit">
      {fields.map(renderField) }
    </div>
  }
}
