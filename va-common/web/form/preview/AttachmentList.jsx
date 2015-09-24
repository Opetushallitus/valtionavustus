import React from 'react'
import ClassNames from 'classnames'

import PreviewComponent from './PreviewComponent.jsx'
import AttachmentDisplay from './AttachmentDisplay.jsx'

export default class AttachmentList extends PreviewComponent {
  render() {
    const attachments = this.props.attachments
    const downloadUrlFn = this.props.toDownloadUrlFn
    if (attachments) {
      const attachmentList = _.map(attachments, (attachment) => {
        return <AttachmentDisplay attachment={attachment}
                                  downloadUrl={downloadUrlFn(attachment)}
                                  translations={this.props.translations}
                                  lang={this.props.lang} />
      })
      return <div className="soresu-all-attachments-list">
               <h1>Kaikki liitteet</h1>
               {attachmentList}
             </div>
    } else {
      return <div classname="soresu-all-attachments-list" />
    }
  }
}
