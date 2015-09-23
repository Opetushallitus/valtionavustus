import React from 'react'
import ClassNames from 'classnames'

import PreviewComponent from './PreviewComponent.jsx'
import LocalizedString from '../component/LocalizedString.jsx'

export default class AttachmentDisplay extends PreviewComponent {
  render() {
    const attachment = this.props.attachment
    const downloadUrl = this.props.downloadUrl
    return attachment ?
               <span>
                 <a href={downloadUrl} target="_blank">{attachment.filename}</a>
                 <span> (liitetty TODO)</span>
               </span> :
               <span/>
  }
}