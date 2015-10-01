import React from 'react'
import ClassNames from 'classnames'

import AttachmentDisplay from './AttachmentDisplay.jsx'
import PreviewComponent from './PreviewComponent.jsx'

export default class AttachmentPreview extends PreviewComponent {
  render() {
    const classStr = ClassNames("soresu-file-upload", { disabled: this.props.disabled })
    return <div className="soresu-attachment-block">
             {this.label(classStr)}
             <AttachmentDisplay {...this.props}/>
           </div>
  }
}
