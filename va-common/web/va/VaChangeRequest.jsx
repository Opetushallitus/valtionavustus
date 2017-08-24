import React from 'react'

import DateUtil from 'soresu-form/web/DateUtil'
import Translator from 'soresu-form/web/form/Translator'

import NameFormatter from './util/NameFormatter'

export default class VaChangeRequest extends React.Component {
  render() {
    const hakemus = this.props.hakemus
    if(hakemus && (hakemus.status === "pending_change_request" || hakemus.status === "officer_edit" )) {
      const translator =  new Translator(this.props.translations["misc"])
      const timeLimiter = translator.translate("time", this.props.lang, "KLO")
      const dateStr = DateUtil.asDateString(hakemus["version-date"]) + " " + timeLimiter + " " + DateUtil.asTimeString(hakemus["version-date"])
      const firstName = NameFormatter.onlyFirstForename(hakemus["user-first-name"])
      const lastName = hakemus["user-last-name"]
      return (
        <div className="change-request">
          <div className="change-request-title">{translator.translate(hakemus.status, this.props.lang)} {dateStr}<span hidden={!firstName} title={firstName + " " + lastName}> ({NameFormatter.shorten(firstName, lastName)})</span></div>
          <pre className="change-request-text">{hakemus["status-comment"]}</pre>
        </div>
      )
    }
    return <div hidden="true" className="change-request" />
  }
}
