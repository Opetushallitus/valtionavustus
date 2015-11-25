import React from 'react'

import DateUtil from 'soresu-form/web/form/DateUtil'
import Translator from 'soresu-form/web/form/Translator.js'

export default class VaChangeRequest extends React.Component {
  render() {
    const hakemus = this.props.hakemus
    if(hakemus && hakemus.status === "pending_change_request") {
      const translator =  new Translator(this.props.translations["misc"])
      const timeLimiter = translator.translate("time", this.props.lang, "KLO")
      const dateStr = DateUtil.asDateString(hakemus["version-date"]) + " " + timeLimiter + " " + DateUtil.asTimeString(hakemus["version-date"])
      const firstName = hakemus["user-first-name"]
      const lastNameInitial = hakemus["user-last-name"] ? hakemus["user-last-name"].charAt(0).toUpperCase() : ''
      return (
        <div className="change-request">
          <div className="change-request-title">{translator.translate("change-request", this.props.lang)} {dateStr}<span hidden={!firstName}> ({firstName} {lastNameInitial})</span></div>
          <pre className="change-request-text">{hakemus["status-comment"]}</pre>
        </div>
      )
    }
    return <div hidden="true" className="change-request" />
  }
}
