import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'
import Dropzone from 'react-dropzone-es6'

import AttachmentDisplay from 'va-common/web/form/preview/AttachmentDisplay.jsx'
import RemoveButton from './RemoveButton.jsx'
import BasicSizedComponent from './BasicSizedComponent.jsx'
import LocalizedString from 'va-common/web/form/component/LocalizedString.jsx'
import HelpTooltip from 'va-common/web/form/component/HelpTooltip.jsx'
import Translator from 'va-common/web/form/Translator'

export default class AttachmentField extends BasicSizedComponent {
  render() {
    const props = this.props
    const translations = this.props.translations
    const lang = this.props.lang
    const classStr = ClassNames(this.resolveClassName("soresu-file-upload"), { disabled: this.props.disabled })
    const existingAttachment = this.props.allAttachments[this.props.field.id]

    const propertiesWithAttachment = _.extend({ attachment: existingAttachment }, props)
    const attachmentElement = existingAttachment ? <ExistingAttachmentComponent {...propertiesWithAttachment}  /> :
      <Dropzone className={classStr} id={props.htmlId} name={props.htmlId} onDrop={props.onDrop}
                             disableClick={props.disabled} multiple={false}>
                     <LocalizedString className="soresu-upload-button" translations={translations.form.attachment} translationKey="uploadhere" lang={lang}/>
                   </Dropzone>

    return <div className="soresu-attachment-input-field">
             {this.label(classStr)}
             {attachmentElement}
           </div>
  }
}

class ExistingAttachmentComponent {
  render() {
    const attachment = this.props.attachment
    const downloadUrl = this.props.downloadUrl
    const removeProperties = _.cloneDeep(this.props)
    removeProperties.renderingParameters = removeProperties.renderingParameters ? removeProperties.renderingParameters : {}
    removeProperties.renderingParameters.removeMe = this.props.onRemove

    const attachmentDisplay = <AttachmentDisplay {...this.props} attachment={attachment} downloadUrl={downloadUrl}/>
    const removeButton = React.createElement(RemoveButton, removeProperties)
    return <div>
             {attachmentDisplay}
             {removeButton}
           </div>
  }
}