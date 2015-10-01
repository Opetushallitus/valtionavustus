import React from 'react'
import ClassNames from 'classnames'

import FormUtil from 'soresu-form/web/form/FormUtil.js'
import LocalizedString from 'soresu-form/web/form/component/LocalizedString.jsx'
import PreviewComponent from './PreviewComponent.jsx'
import AttachmentDisplay from './AttachmentDisplay.jsx'

export default class AttachmentList extends PreviewComponent {
  render() {
    const form = this.props.state.form
    const attachments = this.props.attachments
    const downloadUrlFn = this.props.toDownloadUrlFn
    if (attachments) {
      const attachmentList = _.map(attachments, (attachment) => {
        const field = FormUtil.findField(form, attachment["field-id"])
        return <div>
                 <h2><LocalizedString lang={this.props.lang} translations={field} translationKey="label" /></h2>
                 <AttachmentDisplay attachment={attachment}
                                    downloadUrl={downloadUrlFn(attachment)}
                                    translations={this.props.translations}
                                    lang={this.props.lang} />
               </div>
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
