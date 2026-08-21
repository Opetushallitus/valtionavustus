import { useCallback, useEffect, useRef, useState } from 'react'

import HttpUtil from 'soresu-form/web/HttpUtil'

import { MaksatusSendStatus } from '../../types'

const POLL_INTERVAL_MS = 2000
const MAX_CONSECUTIVE_POLL_FAILURES = 5

export type BatchSendStatus = {
  id: number
  'send-status': MaksatusSendStatus | null
  'sent-count': number
  'total-count': number | null
}

const statusUrl = (avustushakuId: number, batchId: number) =>
  `/api/send-maksatukset-and-tasmaytysraportti/avustushaku/${avustushakuId}/payments-batch/${batchId}/status`

const sendUrl = (avustushakuId: number, batchId: number) =>
  `/api/send-maksatukset-and-tasmaytysraportti/avustushaku/${avustushakuId}/payments-batch/${batchId}`

export const useSendMaksatukset = (avustushakuId: number, onFinished: () => Promise<void>) => {
  const [batchId, setBatchId] = useState<number>()
  const [status, setStatus] = useState<BatchSendStatus>()
  const [startError, setStartError] = useState<string>()

  // Keep the callback in a ref so a new function identity does not restart polling.
  const onFinishedRef = useRef(onFinished)
  onFinishedRef.current = onFinished

  useEffect(() => {
    if (batchId === undefined) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let consecutiveFailures = 0

    // Finishing must not be left half-done if the refresh fails: the redux flag is already cleared
    // at the start of the callback, so an exception here must not propagate back into the poll loop.
    const finish = async () => {
      try {
        await onFinishedRef.current()
      } catch (e) {
        console.error('Maksatusten lähetyksen viimeistely epäonnistui', e)
      }
    }

    const tick = async () => {
      let next: BatchSendStatus
      try {
        next = await HttpUtil.get<BatchSendStatus>(statusUrl(avustushakuId, batchId))
      } catch (e) {
        if (cancelled) return
        consecutiveFailures += 1
        if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
          setStatus(undefined)
          setStartError(
            'Maksatusten lähetyksen tilaa ei saatu haettua. Lataa sivu uudelleen ja tarkista lähetyksen tila.'
          )
          await finish()
          return
        }
        timer = setTimeout(() => void tick(), POLL_INTERVAL_MS)
        return
      }
      if (cancelled) return
      consecutiveFailures = 0
      setStatus(next)
      if (next['send-status'] === 'sending') {
        timer = setTimeout(() => void tick(), POLL_INTERVAL_MS)
      } else {
        await finish()
      }
    }

    void tick()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [avustushakuId, batchId])

  const startSend = useCallback(
    async (id: number) => {
      setStartError(undefined)
      try {
        await HttpUtil.post(sendUrl(avustushakuId, id))
        setStatus(undefined)
        setBatchId(id)
      } catch (e) {
        setStartError('Maksatusten lähetystä ei voitu käynnistää')
        throw e
      }
    },
    [avustushakuId]
  )

  const isSending = status?.['send-status'] === 'sending'

  return { status, startSend, watchBatch: setBatchId, isSending, startError }
}

export type SendMaksatukset = ReturnType<typeof useSendMaksatukset>

export const isSendStopped = (status: MaksatusSendStatus | null | undefined) => status === 'failed'

/** The send has not reached a clean end: either still running, or stopped short. */
export const isSendUnfinished = (status: MaksatusSendStatus | null | undefined) =>
  status === 'sending' || isSendStopped(status)
