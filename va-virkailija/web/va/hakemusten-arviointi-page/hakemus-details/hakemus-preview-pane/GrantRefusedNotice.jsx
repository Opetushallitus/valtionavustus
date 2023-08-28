import React, { Component } from 'react'
import DateUtil from 'soresu-form/web/DateUtil.ts'

export default class GrantRefusedNotice extends Component {
  render() {
    const { application } = this.props
    if (!application.refused) {
      return null
    }
    return (
      <div className="grant-refused-notice soresu-preview">
        <div className="soresu-theme">
          <div className="soresu-preview-fieldset">
            <div>Hakija ei ota avustusta vastaan.</div>
            <div className="soresu-preview-element large">
              <span className="soresu-key">Ilmoitus vastaanotettu</span>
              <span className="soresu-value">
                {DateUtil.asDateTimeString(application['refused-at'])}
              </span>
            </div>
            <div className="soresu-preview-element large">
              <span className="soresu-key">Perustelut</span>
              <span className="soresu-value">{application['refused-comment']}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
