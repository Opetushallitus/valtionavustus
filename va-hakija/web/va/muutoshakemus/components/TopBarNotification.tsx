import React, {useEffect, useState} from 'react'
import {AppContext, SaveState} from '../store/context'
import {useTranslations} from '../TranslationContext'

export function TopBarNotification() {

  const { t } = useTranslations()
  const { state } = React.useContext(AppContext)

  function lastSaveWasAnError(): boolean {
    return state.lastSave?.status === SaveState.SAVE_FAILED
  }

  function lastSaveSucceeded(): boolean {
    return state.lastSave?.status === SaveState.SAVE_SUCCEEDED
  }

  function getNotificationText() {
    if (lastSaveWasAnError()) return t.errorNotification
    if (lastSaveSucceeded()) return t.sentNotification
    return undefined
  }

  function getClassNames(): string {
    if (lastSaveWasAnError()) return 'animate error'
    if (lastSaveSucceeded()) return 'animate success'
    return ''
  }

  const [classNames, setClassNames] = useState<string>()

  function forceAnimation() {
    setClassNames('')
    setTimeout(() => setClassNames(getClassNames()), 400)
  }

  useEffect(() => forceAnimation(), [state.lastSave?.timestamp])

  return (
    <div className='notification-container'>
      <div className={classNames}>
        {getNotificationText()}
      </div>
    </div>
  )
}
