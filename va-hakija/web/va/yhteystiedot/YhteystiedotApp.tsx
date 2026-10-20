import React, { Suspense, use, useState } from 'react'
import { createRoot } from 'react-dom/client'

import 'soresu-form/web/form/style/theme.css'
import './yhteystiedot.css'

import HttpUtil, { HttpResponseError } from 'soresu-form/web/HttpUtil'
import {
  getTranslationContext,
  TranslationContext,
  useTranslations,
} from 'soresu-form/web/va/i18n/TranslationContext'
import { Language } from 'soresu-form/web/va/i18n/translations'
import { Logo } from '../Logo'
import { isJotpaAvustushaku } from '../jotpa'

type YhteystiedotResponse = {
  avustushaku: {
    name: Record<Language, string>
    'operational-unit-code': string | null
  }
  hakemus: {
    'project-name': string
    'register-number': string | null
  }
  contact: { name: string; email: string | null } | null
}

type Result =
  | { status: 'NOT_FOUND' }
  | { status: 'ERROR' }
  | { status: 'LOADED'; yhteystiedot: YhteystiedotResponse }

const [, avustushakuId, userKey] =
  location.pathname.match(/^\/avustushaku\/(\d+)\/hakemus\/([^/]+)\/yhteystiedot\/?$/) ?? []
const initialLang: Language =
  new URLSearchParams(location.search).get('lang') === 'sv' ? 'sv' : 'fi'

const yhteystiedotPromise: Promise<Result> =
  !avustushakuId || !userKey
    ? Promise.resolve({ status: 'NOT_FOUND' })
    : HttpUtil.get<YhteystiedotResponse>(
        `/api/avustushaku/${avustushakuId}/hakemus/${userKey}/yhteystiedot`
      ).then(
        (yhteystiedot): Result => ({ status: 'LOADED', yhteystiedot }),
        (e): Result => ({
          status:
            e instanceof HttpResponseError && e.response.status === 404 ? 'NOT_FOUND' : 'ERROR',
        })
      )

const isJotpa = (result: Result) =>
  result.status === 'LOADED' &&
  isJotpaAvustushaku(result.yhteystiedot.avustushaku['operational-unit-code'] ?? undefined)

const YhteystiedotLogo = () => {
  const { lang } = useTranslations()
  return <Logo showJotpaLogo={isJotpa(use(yhteystiedotPromise))} lang={lang} />
}

const Yhteystiedot = () => {
  const { t } = useTranslations()
  const result = use(yhteystiedotPromise)

  switch (result.status) {
    case 'NOT_FOUND':
      return <p role="alert">{t.yhteystiedot.notFound}</p>
    case 'ERROR':
      return <p role="alert">{t.yhteystiedot.error}</p>
    case 'LOADED':
      return <YhteystiedotContent yhteystiedot={result.yhteystiedot} isJotpa={isJotpa(result)} />
  }
}

const YhteystiedotPage = () => {
  const [lang, setLang] = useState(initialLang)
  const translationContext = getTranslationContext(lang)
  const { t } = translationContext
  const otherLang: Language = lang === 'fi' ? 'sv' : 'fi'

  const changeLanguage = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    history.replaceState(null, '', `?lang=${otherLang}`)
    document.documentElement.lang = otherLang
    setLang(otherLang)
  }

  return (
    <TranslationContext.Provider value={translationContext}>
      <header className="yhteystiedot__topbar">
        <Suspense fallback={null}>
          <YhteystiedotLogo />
        </Suspense>
        <a
          className="yhteystiedot__lang"
          href={`?lang=${otherLang}`}
          lang={otherLang}
          onClick={changeLanguage}
        >
          {t.yhteystiedot.otherLanguage}
        </a>
      </header>
      <main className="yhteystiedot__main">
        <Suspense fallback={<p role="status">{t.yhteystiedot.loading}</p>}>
          <Yhteystiedot />
        </Suspense>
      </main>
    </TranslationContext.Provider>
  )
}

const YhteystiedotContent = ({
  yhteystiedot: { avustushaku, hakemus, contact },
  isJotpa,
}: {
  yhteystiedot: YhteystiedotResponse
  isJotpa: boolean
}) => {
  const { t, lang } = useTranslations()
  return (
    <>
      <h1>{t.yhteystiedot.hakemus}</h1>
      <dl className="yhteystiedot__hakemus">
        <dt>{t.yhteystiedot.hanke}</dt>
        <dd data-test-id="yhteystiedot-hanke">{hakemus['project-name']}</dd>
        <dt>{t.yhteystiedot.hakemusnumero}</dt>
        <dd data-test-id="yhteystiedot-hakemusnumero">{hakemus['register-number']}</dd>
        <dt>{t.yhteystiedot.haku}</dt>
        <dd data-test-id="yhteystiedot-haku">{avustushaku.name[lang]}</dd>
      </dl>

      <h2>{t.yhteystiedot.contactTitle}</h2>
      <div className="yhteystiedot__contact" data-test-id="yhteystiedot-contact">
        {contact ? (
          <>
            <p className="yhteystiedot__contact-name">{contact.name}</p>
            <p className="yhteystiedot__contact-role">
              {t.yhteystiedot.valmistelija}, {isJotpa ? t.yhteystiedot.jotpa : t.yhteystiedot.oph}
            </p>
            {contact.email && (
              <p>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </p>
            )}
          </>
        ) : (
          <p>{t.yhteystiedot.noContact}</p>
        )}
        <p>{t.yhteystiedot.switchboard}</p>
      </div>
      <p className="yhteystiedot__note">{t.yhteystiedot.note}</p>
    </>
  )
}

document.documentElement.lang = initialLang
createRoot(document.getElementById('app')!).render(<YhteystiedotPage />)
