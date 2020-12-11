import React, {useEffect, useState} from 'react'

import { FormikHook } from '../types'
import {useTranslations} from '../TranslationContext'

type TopBarNotificationProps = {
  f: FormikHook
}

export function TopBarNotification({ f }: TopBarNotificationProps) {
  const { t } = useTranslations()

  function getNotificationText() {
    if (f.status?.success === false) return t.errorNotification
    if (f.status?.success) return t.sentNotification
    return undefined
  }

  function getClassNames(): string {
    if (f.status?.success === false) return 'auto-hide error'
    if (f.status?.success) return 'auto-hide success'
    return ''
  }

  const [classNames, setClassNames] = useState<string>()

  function forceAnimation() {
    setClassNames('')
    setTimeout(() => setClassNames(getClassNames()), 400)
  }

  useEffect(() => {
    f.status?.success !== undefined && forceAnimation()
  }, [f.status])

  return (
    <div className='notification-container'>
      <div className={classNames}>
        {getNotificationText()}
      </div>
    </div>
  )
}
