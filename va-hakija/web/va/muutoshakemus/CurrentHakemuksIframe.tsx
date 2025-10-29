import React, { useEffect, useState } from 'react'
import { useTranslations } from 'soresu-form/web/va/i18n/TranslationContext'

export type CurrentHakemusIframeProps = {
  avustushakuId: number
  userKey: string
  currentHakemusIframeRef: React.RefObject<HTMLIFrameElement | null>
}

export default function CurrentHakemusIframe({
  avustushakuId,
  userKey,
  currentHakemusIframeRef,
}: CurrentHakemusIframeProps) {
  const { lang } = useTranslations()
  const iframeUrl = `/avustushaku/${avustushakuId}/nayta?hakemus=${userKey}&lang=${lang}&preview=true&embedForMuutoshakemus=true`

  // Beautiful solution to make the iframe the same height as its content
  const [height, setHeight] = useState<number>(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentHakemusIframeRef?.current?.contentWindow) {
        setHeight(
          currentHakemusIframeRef.current.contentWindow.document.documentElement.scrollHeight ?? 0
        )
      }
    }, 500)

    return () => clearInterval(interval)
  }, [currentHakemusIframeRef])

  return (
    <>
      <iframe
        scrolling="no"
        src={iframeUrl}
        ref={currentHakemusIframeRef}
        width="100%"
        height={height}
        style={{ border: '0' }}
        data-test-id="current-hakemus"
      />
    </>
  )
}
