import React from 'react'
import ClassNames from 'classnames'

import PreviewComponent from './PreviewComponent.jsx'
import LocalizedString from '../component/LocalizedString.jsx'

export default class AttachmentDisplay extends PreviewComponent {
  render() {
    const attachment = this.props.attachment
    const downloadUrl = this.props.downloadUrl
    return attachment ?
      <ExistingAttachmentDisplay attachment={attachment} downloadUrl={downloadUrl} labelText="liitetty" /> :
      <span/>
  }
}

class ExistingAttachmentDisplay extends React.Component {
  render() {
    const attachment = this.props.attachment
    const labelText = this.props.labelText
    const downloadUrl = this.props.downloadUrl
    return <span>
             <a href={downloadUrl} target="_blank">{attachment.filename}</a>
               <span> ({labelText} TODO 0)</span>
           </span>
  }
}