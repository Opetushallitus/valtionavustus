import React from 'react'
import _ from 'lodash'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'
import { Language } from 'soresu-form/web/va/types'

interface Props {
  environment: EnvironmentApiResponse
  lang: Language
}

const EnvironmentInfo = ({ environment, lang }: Props) => {
  const { 'show-name': showName, name, notice: noticeTranslations } = environment

  const notice = noticeTranslations[lang]
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

export default EnvironmentInfo
