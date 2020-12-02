import React, { useEffect, useRef, useState } from 'react'

export type OriginalHakemusIframeProps = { avustushakuId: number, userKey: string }

export default function OriginalHakemusIframe({ avustushakuId, userKey }: OriginalHakemusIframeProps) {
  const iframeUrl = `/avustushaku/${avustushakuId}/nayta?hakemus=${userKey}&decision-version=true&preview=true`

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

  return <iframe src={iframeUrl} ref={iframeRef} width="100%" height={height} />
}
