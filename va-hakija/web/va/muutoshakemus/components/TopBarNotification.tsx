import React, {useEffect, useState} from 'react'

import { FormikHook } from 'va-common/web/va/types/muutoshakemus'

import {useTranslations} from '../../../../../va-common/web/va/i18n/TranslationContext'

type TopBarNotificationProps = {
  f: FormikHook
}

export function TopBarNotification({ f }: TopBarNotificationProps) {
  const { t } = useTranslations()

  function getNotificationText() {
    if (f.status?.success === false) return t.errorNotification
    if (f.status?.success) {
      return f.values.haenKayttoajanPidennysta ? t.sentNotification : t.savedNotification
    }
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
