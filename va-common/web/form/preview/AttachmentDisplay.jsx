import React from 'react'
import ClassNames from 'classnames'

import PreviewComponent from './PreviewComponent.jsx'
import {BasicInfoComponent} from '../component/InfoElement.jsx'
import LocalizedString from '../component/LocalizedString.jsx'

export default class AttachmentDisplay extends PreviewComponent {
  render() {
    return this.props.attachment ?
      <ExistingAttachmentDisplay {...this.props} /> :
      <span/>
  }
}

class ExistingAttachmentDisplay extends BasicInfoComponent {
  render() {
    const attachment = this.props.attachment
    const dateTimeString = this.asDateTimeString(attachment.created_at)
    return <span>
             <a href={this.props.downloadUrl} target="_blank">{attachment.filename}</a>
               <span> (<LocalizedString translations={this.props.translations.form.attachment}
                                        translationKey="attached"
                                        lang={this.props.lang}/> {dateTimeString})
               </span>
           </span>
  }
}