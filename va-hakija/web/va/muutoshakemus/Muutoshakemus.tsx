import React, { ReactNode, useEffect, useState } from 'react'
import moment from 'moment'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { MuutoshakemusValues } from 'soresu-form/web/va/MuutoshakemusValues'
import { Muutoshakemus, MuutoshakemusProps } from 'soresu-form/web/va/types/muutoshakemus'
import {
  getProjectEndDate,
  getProjectEndMoment,
  getTalousarvio,
  getTalousarvioValues,
} from 'soresu-form/web/va/Muutoshakemus'
import { useTranslations } from 'soresu-form/web/va/i18n/TranslationContext'

import { MuutoshakemusFormSection } from './components/MuutoshakemusFormSection'
import { PerustelutTextArea } from './components/PerustelutTextArea'
import { AvustuksenKayttoaikaInput } from './components/jatkoaika/AvustuksenKayttoaikaInput'
import { TalousarvioForm } from './components/talous/TalousarvioForm'
import { ContactPerson } from './components/contact-person/ContactPerson'
import { TopBar } from './components/TopBar'
import OriginalHakemusIframe from './OriginalHakemusIframe'
import ErrorBoundary from './ErrorBoundary'
import { createFormikHook } from './formik'
import { Query } from './MuutoshakemusApp'
import { fiShortFormat } from 'soresu-form/web/va/i18n/dateformat'

import 'soresu-form/web/form/style/main.less'
import '../style/main.less'
import { getInputErrorClass } from 'soresu-form/web/va/formikHelpers'
import { ErrorMessage } from './ErrorMessage'

const initialState: MuutoshakemusProps = {
  status: 'LOADING',
  environment: undefined,
  avustushaku: undefined,
  hakemus: undefined,
  muutoshakemukset: [],
}

const MuutoshakemusSection = ({
  children,
  className,
  ...props
}: {
  children: ReactNode
  className?: string
}) => (
  <section className={`muutoshakemus__section ${className ?? ''}`} {...props}>
    <div className="muutoshakemus__section-content">{children}</div>
  </section>
)

export const MuutoshakemusComponent = ({ query }: { query: Query }) => {
  const { t, lang } = useTranslations()
  const userKey = query['user-key'] || ''
  const avustushakuId = query['avustushaku-id'] ? parseInt(query['avustushaku-id']) : 0
  const [state, setState] = useState<MuutoshakemusProps>(initialState)
  const f = createFormikHook(userKey, lang)
  const existingNewMuutoshakemus = state.muutoshakemukset.find((m) => m.status === 'new')
  const enableBudgetChange = state.hakemus?.talousarvio && state.hakemus.talousarvio.length > 1

  useEffect(() => {
    const fetchProps = async () => {
      const environmentP = HttpUtil.get(`/environment`)
      const avustushakuP = HttpUtil.get(`/api/avustushaku/${avustushakuId}`)
      const hakemusP = HttpUtil.get(
        `/api/avustushaku/${avustushakuId}/hakemus/${userKey}/normalized`
      )
      const muutoshakemuksetP = HttpUtil.get(
        `/api/avustushaku/${avustushakuId}/hakemus/${userKey}/muutoshakemus`
      )
      const [environment, avustushaku, hakemus, muutoshakemukset] = await Promise.all([
        environmentP,
        avustushakuP,
        hakemusP,
        muutoshakemuksetP,
      ])
      const currentProjectEnd = getProjectEndMoment(avustushaku, muutoshakemukset)
      const talousarvio = getTalousarvio(muutoshakemukset, hakemus.talousarvio)
      const hasTrustedContact =
        hakemus?.['trusted-contact-phone'] &&
        hakemus?.['trusted-contact-email'] &&
        hakemus?.['trusted-contact-name']
      f.resetForm({
        values: {
          name: hakemus['contact-person'],
          email: hakemus['contact-email'],
          phone: hakemus['contact-phone'],
          hasTrustedContact: hasTrustedContact !== undefined,
          trustedContactName: hakemus['trusted-contact-name'],
          trustedContactEmail: hakemus['trusted-contact-email'],
          trustedContactPhone: hakemus['trusted-contact-phone'],
          haenSisaltomuutosta: false,
          haenKayttoajanPidennysta: false,
          haenMuutostaTaloudenKayttosuunnitelmaan: false,
          haettuKayttoajanPaattymispaiva: currentProjectEnd.isValid()
            ? currentProjectEnd.toDate()
            : new Date(),
          sisaltomuutosPerustelut: '',
          kayttoajanPidennysPerustelut: '',
          taloudenKayttosuunnitelmanPerustelut: '',
          talousarvio: getTalousarvioValues(talousarvio),
        },
      })

      setState({
        environment,
        avustushaku,
        hakemus,
        muutoshakemukset,
        status: 'LOADED',
      })
    }

    fetchProps()
  }, [])

  useEffect(() => {
    const fetchMuutoshakemukset = async () => {
      if (f.status && f.status.success) {
        const muutoshakemukset: Muutoshakemus[] = await HttpUtil.get(
          `/api/avustushaku/${avustushakuId}/hakemus/${userKey}/muutoshakemus`
        )
        setState({ ...state, muutoshakemukset })
      }
    }
    fetchMuutoshakemukset()
  }, [f.status])

  const existingMuutoshakemus = (
    m: Muutoshakemus,
    index: number,
    allMuutoshakemus: Muutoshakemus[]
  ) => {
    const projectEndDate = getProjectEndDate(state.avustushaku, allMuutoshakemus, m)
    const topic = `${t.muutoshakemus.title} ${moment(m['created-at']).format(fiShortFormat)}`
    const waitingForDecision = m.status === 'new' ? ` - ${t.waitingForDecision}` : ''
    return (
      <MuutoshakemusSection
        data-test-class="existing-muutoshakemus"
        data-test-state={m.status}
        key={index}
      >
        <div
          className="existing-muutoshakemus__title"
          data-test-id="existing-muutoshakemus-title"
        >{`${topic}${waitingForDecision}`}</div>
        <div className="existing-muutoshakemus__form">
          <MuutoshakemusValues
            currentTalousarvio={getTalousarvio(allMuutoshakemus, state.hakemus?.talousarvio, m)}
            muutoshakemus={m}
            hakijaUrl={state.environment?.['hakija-server'].url[lang]}
            projectEndDate={projectEndDate}
          />
        </div>
      </MuutoshakemusSection>
    )
  }

  if (state.status === 'LOADING') {
    return <p>{t.loading}</p>
  }

  return (
    <form className="muutoshakemus__form" onSubmit={f.handleSubmit}>
      <TopBar env={state.environment?.name || ''} f={f} />
      <ErrorBoundary>
        <MuutoshakemusSection className="muutoshakemus__top-form">
          {state.avustushaku && (
            <ContactPerson
              avustushakuName={state.avustushaku.content.name[lang]}
              projectName={state.hakemus?.['project-name'] || ''}
              registerNumber={state.hakemus?.['register-number']}
              f={f}
            />
          )}
          {f.values.hasTrustedContact && (
            <div className="muutoshakemus__form-row">
              <div className="muutoshakemus__form-cell">
                <label className="muutoshakemus__label" htmlFor="trusted-contact-name">
                  {t.contactPersonEdit.trustedContactName}
                </label>
                <input
                  id="trusted-contact-name"
                  className="muutoshakemus__input muutoshakemus__input--contact"
                  name="trustedContactName"
                  type="text"
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  value={f.values.trustedContactName}
                />
              </div>
              <div className="muutoshakemus__form-cell">
                <label className="muutoshakemus__label" htmlFor="trusted-contact-email">
                  {t.contactPersonEdit.trustedContactEmail}
                </label>
                <input
                  id="trusted-contact-email"
                  name="trustedContactEmail"
                  type="text"
                  className={`${getInputErrorClass(
                    f,
                    'trustedContactEmail',
                    'muutoshakemus__input',
                    'muutoshakemus__input-error'
                  )}  muutoshakemus__input--contact`}
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  value={f.values.trustedContactEmail}
                />
                <ErrorMessage text={f.errors.trustedContactEmail} />
              </div>
              <div className="muutoshakemus__form-cell">
                <label className="muutoshakemus__label" htmlFor="trusted-contact-phone">
                  {t.contactPersonEdit.trustedContactPhone}
                </label>
                <input
                  id="trusted-contact-phone"
                  className="muutoshakemus__input muutoshakemus__input--contact"
                  name="trustedContactPhone"
                  type="text"
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  value={f.values.trustedContactPhone}
                />
              </div>
            </div>
          )}
          {!existingNewMuutoshakemus && (
            <>
              <h2 className="muutoshakemus__sub-title">{t.applicationEdit.title}</h2>
              <div>
                <MuutoshakemusFormSection
                  f={f}
                  name="haenSisaltomuutosta"
                  title={t.sisaltomuutos.checkboxTitle}
                >
                  <PerustelutTextArea
                    f={f}
                    name="sisaltomuutosPerustelut"
                    title={t.sisaltomuutos.title}
                  />
                </MuutoshakemusFormSection>
                <MuutoshakemusFormSection
                  f={f}
                  name="haenKayttoajanPidennysta"
                  title={t.kayttoajanPidennys.checkboxTitle}
                >
                  <AvustuksenKayttoaikaInput
                    f={f}
                    projectEnd={getProjectEndDate(state.avustushaku, state.muutoshakemukset)}
                  />
                </MuutoshakemusFormSection>
                {enableBudgetChange && (
                  <MuutoshakemusFormSection
                    f={f}
                    name="haenMuutostaTaloudenKayttosuunnitelmaan"
                    title={t.muutosTaloudenKayttosuunnitelmaan.checkboxTitle}
                  >
                    <TalousarvioForm
                      f={f}
                      talousarvio={getTalousarvio(
                        state.muutoshakemukset,
                        state.hakemus?.talousarvio
                      )}
                    />
                  </MuutoshakemusFormSection>
                )}
              </div>
            </>
          )}
        </MuutoshakemusSection>
        {state.muutoshakemukset.map(existingMuutoshakemus)}
        <MuutoshakemusSection>
          <OriginalHakemusIframe avustushakuId={avustushakuId} userKey={userKey} />
        </MuutoshakemusSection>
      </ErrorBoundary>
    </form>
  )
}
