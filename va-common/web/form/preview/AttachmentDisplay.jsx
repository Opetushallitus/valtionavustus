import React from 'react'

import LocalizedString from 'va-common/web/form/component/LocalizedString.jsx'

export default class AttachmentDisplay {
  render() {
    const attachment = this.props.attachment
    const downloadUrl = this.props.downloadUrl

    return <span>
             <a href={downloadUrl} target="_blank">{attachment.filename}</a>
             <span> (liitetty TODO)</span>
           </span>
  }
}