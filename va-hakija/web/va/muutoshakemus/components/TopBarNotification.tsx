import React, { useEffect, useState } from 'react'

import { FormikHook } from 'soresu-form/web/va/types/muutoshakemus'

import { useTranslations } from 'soresu-form/web/va/i18n/TranslationContext'

type TopBarNotificationProps = {
  f: FormikHook
}

export function TopBarNotification({ f }: TopBarNotificationProps) {
  const { t } = useTranslations()

  function getNotificationText() {
    if (f.status?.success === false) return t.errorNotification
    if (f.status?.success) {
      const isApplication =
        f.values.haenKayttoajanPidennysta ||
        f.values.haenMuutostaTaloudenKayttosuunnitelmaan ||
        f.values.haenSisaltomuutosta
      return isApplication ? t.sentNotification : t.savedNotification
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
    <div className="notification-container">
      <div className={classNames}>{getNotificationText()}</div>
    </div>
  )
}
