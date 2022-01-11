import React from "react"
import _ from "lodash"

export default class EnvironmentInfo extends React.Component {
  render() {
    const {
      "show-name": showName,
      name,
      notice: noticeTranslations
    } = this.props.environment

    const notice = noticeTranslations[this.props.lang]
    const showNotice = !_.isEmpty(notice)

    if (!showName && !showNotice) {
      return null
    }

    return (
      <div className="environment-info">
        {showName && <div className="environment-info__name">{name}</div>}
        {showNotice && <div className="environment-info__notice">{notice}</div>}
      </div>
    )
  }
}
