import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'
import Dropzone, { DropEvent, FileRejection } from 'react-dropzone'

import AttachmentDisplay from '../preview/AttachmentDisplay.jsx'
import RemoveButton from './RemoveButton.jsx'
import BasicFieldComponent from './BasicFieldComponent'
import LocalizedString from './LocalizedString'

interface Props {
  allAttachments: any
  renderingParameters?: any
  downloadUrl: any
  onRemove: () => void
  onDrop: <T extends File>(
    acceptedFiles: T[],
    fileRejections: FileRejection[],
    event: DropEvent
  ) => void
}

export default class AttachmentField extends BasicFieldComponent<Props> {
  render() {
    const props = this.props
    const translations = this.props.translations
    const lang = this.props.lang
    const classStr = ClassNames(this.resolveClassName('soresu-file-upload'), {
      disabled: props.disabled,
    })
    const uploadButtonClassStr = ClassNames(this.resolveClassName('soresu-upload-button'))
    const existingAttachment = this.props.allAttachments[this.props.field.id]
    const propertiesWithAttachment = _.extend({ attachment: existingAttachment }, props)
    const attachmentElement = existingAttachment ? (
      <ExistingAttachmentComponent {...propertiesWithAttachment} />
    ) : (
      <Dropzone onDrop={props.onDrop} multiple={false}>
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps({ className: classStr })}>
            <input
              {...getInputProps({
                disabled: props.disabled,
                id: props.htmlId,
                name: props.htmlId,
              })}
            />
            <LocalizedString
              className={uploadButtonClassStr}
              translations={translations.form.attachment}
              translationKey="uploadhere"
              lang={lang}
            />
          </div>
        )}
      </Dropzone>
    )

    return (
      <div className="soresu-attachment-block soresu-attachment-input-field" id={props.htmlId}>
        {this.label(classStr)}
        {attachmentElement}
      </div>
    )
  }
}

interface ExistingAttachmentComponentProps {
  attachment: any
}

class ExistingAttachmentComponent extends React.Component<
  Props & ExistingAttachmentComponentProps
> {
  render() {
    const attachment = this.props.attachment
    const downloadUrl = this.props.downloadUrl
    const removeProperties = { ..._.cloneDeep(this.props) }
    removeProperties.renderingParameters = _.isObject(removeProperties.renderingParameters)
      ? removeProperties.renderingParameters
      : {}
    removeProperties.renderingParameters.removeMe = this.props.onRemove

    const attachmentDisplay = (
      <AttachmentDisplay {...this.props} attachment={attachment} downloadUrl={downloadUrl} />
    )
    const removeButton = <RemoveButton {...removeProperties} />
    return (
      <div>
        {attachmentDisplay}
        {removeButton}
      </div>
    )
  }
}
