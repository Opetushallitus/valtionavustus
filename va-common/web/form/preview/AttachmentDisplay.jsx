import React from 'react'
import ClassNames from 'classnames'

import PreviewComponent from './PreviewComponent.jsx'
import {BasicInfoComponent} from '../component/InfoElement.jsx'
import LocalizedString from '../component/LocalizedString.jsx'

export default class AttachmentDisplay extends PreviewComponent {
  render() {
    return this.props.attachment ?
      <ExistingAttachmentDisplay {...this.props} labelText="liitetty" /> :
      <span/>
  }
}

class ExistingAttachmentDisplay extends BasicInfoComponent {
  render() {
    const attachment = this.props.attachment
    const labelText = this.props.labelText
    const dateTimeString = this.asDateTimeString(attachment.created_at)
    const downloadUrl = this.props.downloadUrl
    return <span>
             <a href={downloadUrl} target="_blank">{attachment.filename}</a>
               <span> (TODO {labelText} {dateTimeString})</span>
           </span>
  }
}