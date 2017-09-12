import React from 'react'
import _ from 'lodash'

import styles from '../style/preview.less'

import {
  BasicFieldEdit,
  BasicEditWrapper,
  AppendableEditWrapper,
  InfoElementEditWrapper
} from './EditComponent.jsx'
import CSSTransitionGroup from '../component/wrapper/CSSTransitionGroup.jsx'
import FormEditComponent from './FormEditComponent'

import FormPreview from '../FormPreview.jsx'

export default class FormEdit extends React.Component {

  static createFormEditComponent(controller, formEditorController, state, field, fieldProperties, renderingParameters) {
    const translations = state.configuration.translations
    return <FormEditComponent {...fieldProperties}
      renderingParameters={renderingParameters}
      translations={translations}
      controller={controller}
      formEditorController={formEditorController}
      customProps={controller.getCustomComponentProperties(state)}
      attachment={state.saveStatus.attachments[field.id]}
      attachmentDownloadUrl={controller.createAttachmentDownloadUrl(state, field) }
      koodistos={state.koodistos}
      koodistosLoader={state.koodistosLoader}/>
  }

  static renderField(controller, formEditorController, state,
    infoElementValues, field, renderingParameters) {

    const fields = state.form.content
    const htmlId = controller.constructHtmlId(fields, field.id)
    const fieldProperties = {
      fieldType: field.fieldType, lang: state.configuration.lang, key: htmlId,
      htmlId: htmlId, field: field }

    if(FormEditComponent.fieldTypeMapping()[field.fieldType]) {
      return FormEdit.createFormEditComponent(controller, formEditorController,
        state, field, fieldProperties, renderingParameters)
    } else if (field.fieldClass == "infoElement") {
      const previewInfoElement =  FormPreview.createInfoComponent(state,
        infoElementValues, field, fieldProperties, false)
      return (
        <InfoElementEditWrapper
          formEditorController={formEditorController}
          wrappedElement={previewInfoElement} htmlId={htmlId} key={htmlId}
          field={field} />
      )
    } else if (field.fieldClass == "wrapperElement") {
      if(controller.getCustomPreviewComponentTypeMapping()[field.fieldType] ||
        field.fieldType === "growingFieldset") {

        const previewWrapperElement = FormPreview.createWrapperComponent(
          FormPreview.renderField, controller, formEditorController, state,
          infoElementValues, field, fieldProperties, renderingParameters)

        return (
          <BasicEditWrapper
            formEditorController={formEditorController}
            wrappedElement={previewWrapperElement}
            htmlId={htmlId} key={htmlId} field={field} />
        )
      }
      else {
        const editableWrapperElement = FormPreview.createWrapperComponent(
          FormEdit.renderField, controller, formEditorController, state,
          infoElementValues, field, fieldProperties, renderingParameters)

        return (
          <AppendableEditWrapper
            formEditorController={formEditorController}
            wrappedElement={editableWrapperElement}
            htmlId={htmlId} key={htmlId} field={field} />
        )
      }
    }
    return (
      <BasicFieldEdit
        formEditorController={formEditorController}
        htmlId={fieldProperties.htmlId}
        key={fieldProperties.htmlId} field={field} />
    )
  }

  render() {
    const controller = this.props.controller
    const formEditorController = this.props.formEditorController
    const infoElementValues = this.props.infoElementValues.content
    const state = this.props.state
    const fields = state.form.content

    const renderField = function(field) {
      return FormEdit.renderField(controller, formEditorController, state, infoElementValues, field)
    }

    const readOnlyNotificationText = formEditorController.readOnlyNotificationText ? formEditorController.readOnlyNotificationText : "Ei muokkausoikeutta"
    const readOnlyNotification = formEditorController.allowEditing ? null : <div className="soresu-read-only-notification">{readOnlyNotificationText}</div>

    return  <div className="soresu-form-edit soresu-edit">
      {readOnlyNotification}
      <CSSTransitionGroup transitionName="soresu-dynamic-children-transition">
        {fields.map(renderField)}
      </CSSTransitionGroup>
    </div>
  }
}
