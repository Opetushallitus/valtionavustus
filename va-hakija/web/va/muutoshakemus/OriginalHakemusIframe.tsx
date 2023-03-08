import React, { useEffect, useRef, useState } from 'react'

import { useTranslations } from 'soresu-form/web/va/i18n/TranslationContext'

export type OriginalHakemusIframeProps = {
  avustushakuId: number
  userKey: string
}

export default function OriginalHakemusIframe({
  avustushakuId,
  userKey,
}: OriginalHakemusIframeProps) {
  const { t, lang } = useTranslations()
  const iframeUrl = `/avustushaku/${avustushakuId}/nayta?hakemus=${userKey}&lang=${lang}&decision-version=true&preview=true&embedForMuutoshakemus=true`

  // Beautiful solution to make the iframe the same height as its content
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [height, setHeight] = useState<number>(0)
  useEffect(() => {
    const interval = setInterval(() => {
      if (iframeRef?.current?.contentWindow) {
        setHeight(iframeRef.current.contentWindow.document.documentElement.scrollHeight ?? 0)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [iframeRef])

  return (
    <>
      <h1 className="muutoshakemus__title">{t.originalHakemus}</h1>
      <iframe
        scrolling="no"
        src={iframeUrl}
        ref={iframeRef}
        width="100%"
        height={height}
        style={{ border: '0' }}
        data-test-id="original-hakemus"
      />
    </>
  )
}
