import React from 'react'

import DateUtil from '../../DateUtil'
import LocalizedString from './LocalizedString.jsx'

export default class FormSaveStatus extends React.Component {
  render() {
    const saveStatus = this.props.saveStatus
    const translations = this.props.translations.form
    const lang = this.props.lang
    const hakemusType = this.props.hakemusType

    const notSentMessage = makeNotSentMessage({savedObject: saveStatus.savedObject, translations, lang, hakemusType})
    const saveMessage = makeSaveMessage({saveStatus, translations, lang})

    if (!saveMessage && !notSentMessage) {
      return null
    }

    return (
      <div id="form-save-status">
        <div className="messages">
          {notSentMessage && <div className="not-sent-message">{notSentMessage}</div>}
          {saveMessage && <div className="save-message">{saveMessage}</div>}
        </div>
      </div>
    )
  }
}

const makeNotSentMessage = ({savedObject, translations, lang, hakemusType}) => {
  if (savedObject &&
      savedObject.status === "draft" &&
      savedObject.version > 1) {
    return <LocalizedString translations={translations} translationKey={hakemusType + "-not-submitted"} lang={lang}/>
  }

  return null
}

const makeSaveMessage = ({saveStatus, translations, lang}) => {
  if (saveStatus.saveInProgress) {
    return <LocalizedString translations={translations} translationKey="saving" lang={lang}/>
  }

  const savedObject = saveStatus.savedObject

  if (saveStatus.serverError === "" &&
      savedObject &&
      savedObject["created-at"] &&
      savedObject.version > 1) {
    return (
      <LocalizedString translations={translations}
                       translationKey="saved"
                       lang={lang}
                       keyValues={{timestamp: formatTimestamp(savedObject["created-at"])}}/>
    )
  }

  return null
}

const formatTimestamp = date => `${DateUtil.asDateString(date)} ${DateUtil.asTimeString(date)}`
