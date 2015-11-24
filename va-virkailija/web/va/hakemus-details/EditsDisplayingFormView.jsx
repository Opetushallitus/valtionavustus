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
      const oldAnswer = _.find(state.answersDelta.changedAnswers, a => { return a.key === field.id })
      if (oldAnswer) {
        return <DiffDisplayingField key={"diff-display-" + field.id} field={field} oldAnswer={oldAnswer}
                                    state={state} infoElementValues={infoElementValues} controller={controller} />
      }
      const previouslyInExistentAnswer = _.find(state.answersDelta.newAnswers, a => { return a.key === field.id })
      if (previouslyInExistentAnswer) {
        const dummyOldAnswer = { value: " " }
        return <DiffDisplayingField key={"diff-display-" + field.id} field={field} oldAnswer={dummyOldAnswer}
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
    state.answersDelta = resolveChangedFields(state.saveStatus.values, state.changeRequests, state.attachmentVersions)

    const renderField = field => {
      return EditsDisplayingFormView.renderField(controller, null, state, infoElementValues, field)
    }

    return  <div className="soresu-preview">
              {fields.map(renderField) }
            </div>

    function resolveChangedFields(currentAnswers, changeRequests, attachmentVersions) {
      if (!changeRequests || changeRequests.length === 0) {
        return { changedAnswers: [], newAnswers: [] }
      }
      const oldestAnswers = changeRequests[0].answers
      const answersDelta = createDeltaFromUpdatedAttachments(attachmentVersions, changeRequests[0].version)
      addDeltaFromChangedAnswers(answersDelta, oldestAnswers, currentAnswers);
      addDeltaFromNewAnswers(currentAnswers, oldestAnswers, answersDelta);
      return answersDelta
    }

    function createDeltaFromUpdatedAttachments(attachmentVersions, oldestHakemusVersion) {
      const versionsByAttachmentId = _.groupBy(attachmentVersions, v => { return v.id })
      _.forEach(_.keys(versionsByAttachmentId), attachmentId => {
        versionsByAttachmentId[attachmentId] = stripNonSubmittedVersions(versionsByAttachmentId[attachmentId])
      })
      const idsOfUpdatedAttachments = _.filter(_.keys(versionsByAttachmentId), attachmentId => { 
        return versionsByAttachmentId[attachmentId].length > 1
      })
      return { changedAnswers: _.map(idsOfUpdatedAttachments, attachmentId => {
        const oldestRelevantAttachmentVersion = _.first(versionsByAttachmentId[attachmentId])
        return { fieldType: "namedAttachment",
                 key: oldestRelevantAttachmentVersion["field-id"],
                 value: oldestRelevantAttachmentVersion.filename,
                 attachmentVersion: oldestRelevantAttachmentVersion }
      }), newAnswers: [] }

      function stripNonSubmittedVersions(versionsOfAttachment) {
        const beforeAndAfterSubmission = _.partition(versionsOfAttachment, v => { return v["hakemus-version"] <= oldestHakemusVersion })
        const originalSubmittedAttachmentVersion = _.first(_.sortByOrder(beforeAndAfterSubmission[0], "version", "desc"))
        const attachmentVersionsAfterSubmissions = beforeAndAfterSubmission[1]
        return [ originalSubmittedAttachmentVersion ].concat(attachmentVersionsAfterSubmissions)
      }
    }

    function addDeltaFromChangedAnswers(answersDelta, oldestAnswers, currentAnswers) {
      const originalValuesOfChangedOldFields = JsUtil.flatFilter(oldestAnswers, oldAnswer => {
        const newValueArray = JsUtil.flatFilter(currentAnswers, newAnswer => newAnswer.key === oldAnswer.key)
        return newValueArray.length === 0 || newValueArray[0].value !== oldAnswer.value
      })
      _.forEach(originalValuesOfChangedOldFields, originalValue => {
        answersDelta.changedAnswers.push(originalValue)
      })
    }

    function addDeltaFromNewAnswers(currentAnswers, oldestAnswers, answersDelta) {
      const newValuesOfNewFields = JsUtil.flatFilter(currentAnswers, currentAnswer => {
        const oldValueArray = JsUtil.flatFilter(oldestAnswers, oldAnswer => oldAnswer.key === currentAnswer.key)
        return oldValueArray.length === 0 || oldValueArray[0].value !== currentAnswer.value
      })
      _.forEach(newValuesOfNewFields, newValue => {
        answersDelta.newAnswers.push(newValue)
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
    const oldValueDisplay = renderFieldWithOldValue()
    return <div>
             <div key="answer-old-value" className="answer-old-value">
               {oldValueDisplay}
             </div>
             <div key="answer-new-value" className="answer-new-value">
               {FormPreview.renderField(controller, null, state, infoElementValues, field)}
             </div>
           </div>

    function renderFieldWithOldValue() {
      if (field.fieldType === "namedAttachment") {
        return createOldAttachmentVersionDisplay()
      }
      return FormPreview.renderField(controller, null, state, infoElementValues, field, { overridingInputValue: oldAnswer.value })
    }

    function createOldAttachmentVersionDisplay() {
      const attachmentVersion = oldAnswer.attachmentVersion
      if (!attachmentVersion) {
        return null
      }
      const fields = state.form.content
      const htmlId = controller.constructHtmlId(fields, field.id)
      const fieldProperties = { fieldType: field.fieldType, lang: state.configuration.lang, key: htmlId, htmlId: htmlId, field: field }
      const renderingParameters = { overridingInputValue: oldAnswer.value };
      const downloadUrl = controller.createAttachmentVersionDownloadUrl(field, attachmentVersion.version);
      return FormPreview._createFormPreviewComponent(controller, state, field, fieldProperties, renderingParameters, attachmentVersion, downloadUrl)
    }
  }
}
