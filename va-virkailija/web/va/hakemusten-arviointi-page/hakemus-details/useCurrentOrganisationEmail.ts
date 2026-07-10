import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import HttpUtil from 'soresu-form/web/HttpUtil'
import { Hakemus } from 'soresu-form/web/va/types'
import { Email } from './common-components/MultipleRecipentsEmailForm'

export const getOrgEmailWarningMessage = (email: string): string =>
  `Organisaation voimassa olevaa sähköpostiosoitetta ei saatu haettua organisaatiopalvelusta. Varmista, että "${email}" on oikein.`

export function getStoredOrgEmail(hakemus: Hakemus): string | undefined {
  return hakemus.answers.find((a) => a.key === 'organization-email')?.value || undefined
}

export function getValiselvitysOrgEmail(hakemus: Hakemus): string | undefined {
  return hakemus.normalizedData?.['valiselvitys-organization-email'] || undefined
}

export function getLoppuselvitysOrgEmail(hakemus: Hakemus): string | undefined {
  return hakemus.normalizedData?.['loppuselvitys-organization-email'] || undefined
}

export function resolveOrgEmailFallback(...emails: (string | undefined)[]): string | undefined {
  return emails.find((email) => email) || undefined
}

const inflightOrgEmail = new Map<string, Promise<string | undefined>>()

export function fetchCurrentOrgEmail(
  avustushakuId: number,
  hakemusId: number
): Promise<string | undefined> {
  const key = `${avustushakuId}/${hakemusId}`
  const existing = inflightOrgEmail.get(key)
  if (existing) {
    return existing
  }
  const request = HttpUtil.get<{ email: string | null }>(
    `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/organisation-email`
  )
    .then((res) => res.email ?? undefined)
    .finally(() => inflightOrgEmail.delete(key))
  inflightOrgEmail.set(key, request)
  return request
}

export function prependOrgEmailToReceivers(email: Email, orgEmail: string | undefined): Email {
  if (orgEmail && !email.receivers.includes(orgEmail)) {
    return { ...email, receivers: [orgEmail, ...email.receivers] }
  }
  return email
}

export function usePrependCurrentOrgEmailToReceivers(
  avustushakuId: number,
  hakemusId: number,
  setEmail: Dispatch<SetStateAction<Email>>,
  enabled = true,
  fallbackOrgEmail?: string
): {
  pending: boolean
  currentOrgEmail: string | undefined
  orgEmailMissing: boolean
  orgEmailFallback: boolean
} {
  const [state, setState] = useState<{
    loading: boolean
    email: string | undefined
    fallback: boolean
  }>({
    loading: enabled,
    email: undefined,
    fallback: false,
  })
  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, email: undefined, fallback: false })
      return
    }
    let cancelled = false
    setState({ loading: true, email: undefined, fallback: false })
    const applyResult = (liveEmail: string | undefined) => {
      if (cancelled) return
      const email = liveEmail ?? fallbackOrgEmail
      const fallback = !liveEmail && !!fallbackOrgEmail
      if (email) {
        setEmail((prev) => prependOrgEmailToReceivers(prev, email))
      }
      setState({ loading: false, email, fallback })
    }
    fetchCurrentOrgEmail(avustushakuId, hakemusId)
      .then(applyResult)
      .catch(() => applyResult(undefined))
    return () => {
      cancelled = true
    }
  }, [avustushakuId, hakemusId, enabled, setEmail, fallbackOrgEmail])
  return {
    pending: state.loading,
    currentOrgEmail: state.email,
    orgEmailMissing: enabled && !state.loading && !state.email,
    orgEmailFallback: enabled && !state.loading && state.fallback,
  }
}
